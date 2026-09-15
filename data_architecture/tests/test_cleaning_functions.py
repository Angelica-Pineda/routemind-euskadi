import pytest
import tempfile
import os
import json
from pyspark.sql import SparkSession
from pyspark.sql import types as T


# 'data_architecture' needs to be marked as source root
from src.utils.cleaning_functions import (
    explode_array_column,
    extract_and_cast,
    empty_string_to_null
)

# --- MOCKS DATA CREATION  ---

@pytest.fixture(scope="session")
def spark():
    """Reutiliza la sesión activa de Spark en Databricks."""
    return SparkSession.builder.getOrCreate()

#@pytest.fixture(scope="session")
#def spark():
    """Reutiliza la sesión activa de Spark en Databricks."""
    return SparkSession.builder.getOrCreate()

@pytest.fixture(scope="session")
def mock_raw_df(spark):
    """
    Crete a mock Dataframe to be used in tests.
    sc.parallelize simulate the reading process of a JSON file.
    """
    mock_dict = {
        "rows": {
            "row": [
                {
                    "documentName": "docname1",
                    "documentDescription": "Doc descrip 1",
                    "templateType": "temp type 1",
                    "phone": "333 000 555",
                    "address": "street,1",
                    "marks": "Bilbao",
                    "tourismEmail": "test@test.org",
                    "postalCode": 48008,
                    "latitudelongitude": "43.25731611140031,-2.9335773613769334",
                    "latwgs84": 43.257316111400307,
                    "lonwgs84": -2.9335773613769334,
                    "municipality": "Bilbao",
                    "municipalitycode": 20,
                    "territory": "Bizkaia",
                    "territorycode": 48,
                    "country": "España",
                    "countrycode": 108,
                    "@num": 1
                },
                {
                    "documentName": "docname2",
                    "documentDescription": "Doc descrip 2",
                    "phone": "444 111 555",
                    "address": "street,3",
                    "marks": "Vitoria-Gasteiz",
                    "tourismEmail": "",
                    "postalCode": 48008,
                    "latwgs84": 43.257316111400307,
                    "lonwgs84": -2.9335773613769334,
                    "municipality": "Vitoria-Gasteiz",
                    "municipalitycode": 20,
                    "@num": 2
                }
            ]
        }
    }

    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json", encoding="utf-8") as tmp:
        json.dump(mock_dict, tmp)
        tmp_path = tmp.name

    try:

        df = spark.read.option("multiline", "true").json(tmp_path)
        yield df

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# --- UNIT TESTS USING MOCKS ---

def test_explode_array_column_with_mock(mock_raw_df):
    """Test that the nested JSON is correctly flattened into individual rows"""
    
    # Execute function explode_array_column in mock data
    result_df = explode_array_column(mock_raw_df, array_col_path="rows.row", output_col="exploded_item")
    
    # Check number of rows created from array
    assert result_df.count() == 2
    
    # check if new struct column "exploded_item" exists 
    assert "exploded_item" in result_df.columns
    
    # check internal results
    data = result_df.collect()
    assert data[0]["exploded_item"]["documentName"] == "docname1"
    assert data[1]["exploded_item"]["documentName"] == "docname2"


def test_extract_and_cast_with_mock(mock_raw_df):
    """Test fields extractions from a struct column and casting."""
    
    # Execute function explode_array_column in mock data as first step in normal data flow
    exploded_df = explode_array_column(mock_raw_df, array_col_path="rows.row", output_col="exploded_item")
    
    # Define mapping for mock data
    cast_map = {
        "documentName": T.StringType(),
        "latwgs84": T.DoubleType(),
        "municipalitycode": T.IntegerType(),
        "@num": T.IntegerType()
    }
    
    # apply function extract_and_cast to extract data from struct and cast data types
    result_df = extract_and_cast(exploded_df, struct_col="exploded_item", cast_map=cast_map)
    
    # Schema validations (Data Types)
    assert result_df.schema["documentName"].dataType == T.StringType()
    assert result_df.schema["latwgs84"].dataType == T.DoubleType()
    assert result_df.schema["municipalitycode"].dataType == T.IntegerType()
    
    # Data validations
    data = result_df.orderBy("@num").collect()
    assert data[0]["documentName"] == "docname1"
    assert data[0]["latwgs84"] == 43.257316111400307
    assert data[0]["municipalitycode"] == 20


def test_empty_string_to_null_with_mock(mock_raw_df):
    """test if empty emails are converted to null."""
    
    # make preps on data to be able to test function
    exploded_df = explode_array_column(mock_raw_df, array_col_path="rows.row", output_col="item")
    extracted_df = extract_and_cast(
        exploded_df, 
        struct_col="item", 
        cast_map={"documentName": T.StringType(), "tourismEmail": T.StringType()}
    )
    
    # Second row has "tourismEmail": "" (empty string)
    result_df = empty_string_to_null(extracted_df, columns=["tourismEmail"])
    
    # filter to look for "docname2" and column tourismEmail
    doc2_data = result_df.filter(result_df.documentName == "docname2").collect()[0]
    
    assert doc2_data["tourismEmail"] is None



