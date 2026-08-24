from pyspark.sql import DataFrame, Column
from pyspark.sql import functions as F
from pyspark.sql import types as T
from pyspark.sql.window import Window
from typing import Dict, List, Optional

def explode_array_column(
    df: DataFrame,
    array_col_path: str,
    output_col: str = "row_item"
) -> DataFrame:
    """
    Explode a column array<struct<...>> (nested).
 
    Args:
        df: Source DataFrame.
        array_col_path: array column "rows.row".
        output_col: Column with explode result.
 
    Returns:
        DataFrame with new column `output_col` struct type.
    """
    return df.withColumn(output_col, F.explode(F.col(array_col_path)))


def extract_and_cast(
    df: DataFrame,
    struct_col: str,
    cast_map: Dict[str, T.DataType]
) -> DataFrame:
    """
    Extract columns from a struct column and apply a cast based on data type. if cast fail 
    a NULL value will be assigned.
 
    Args:
        df: DataFrame with previous explode process applied.
        struct_col:  struct column.
        cast_map: dict {target column: data type}.
            Ej: {"documentName": T.StringType(), "latwgs84": T.DoubleType()}
 
    Returns:
        DataFrame with columns extracted and casted.
    """
    select_exprs = [
        F.col(f"{struct_col}.{col_name}").cast(dtype).alias(col_name)
        for col_name, dtype in cast_map.items()
    ]
    return df.select(*select_exprs)
 
 

def empty_string_to_null(
    df: DataFrame,
    columns: Optional[List[str]] = None
) -> DataFrame:
    """
    Converts empty strings to NULL.
    If no columns are specified, this applies to all columns of type string.
 
    Args:
        df: Source DataFrame.
        columns: list of columns to be cleaned. If None,string columns are detected automatically.
 
    Returns:
        DataFrame with empty strings converted to NULL.
    """
    if columns is None:
        columns = [f.name for f in df.schema.fields if isinstance(f.dataType, T.StringType)]
 
    for c in columns:
        df = df.withColumn(
            c,
            F.when(F.trim(F.col(c)) == "", None).otherwise(F.col(c))
        )
    return df
 

def drop_null_required(
    df: DataFrame,
    required_columns: List[str],
    treat_empty_string_as_null: bool = True
) -> DataFrame:
    """
    Drop rows where not null columns are NULL.
    (optionally treating empty strings as NULL before filtering).
 
    Args:
        df: DataFrame.
        required_columns: Not NULL columns.
        treat_empty_string_as_null: if True, normalize "" -> NULL before filter.
 
    Returns:
        DataFrame filtered with completed records.
    """
    if treat_empty_string_as_null:
        df = empty_string_to_null(df, required_columns)
 
    return df.dropna(subset=required_columns)
 
 

def add_category_column(
    df: DataFrame,
    category_value: str,
    column_name: str = "category"
) -> DataFrame:
    """
    Add a column that identifies the source category
 
    Args:
        df: DataFrame.
        category_value: Category value
        column_name: target column name.
 
    Returns:
        DataFrame with category column added.
    """
    return df.withColumn(column_name, F.lit(category_value))
 
 

def deduplicate(
    df: DataFrame,
    keys: List[str],
    order_by_col: Optional[str] = None
) -> DataFrame:
    """
    Drop duplicates based on one or more keys
 
    Args:
        df: DataFrame.
        keys: Key columns (ej. ["documentName", "category"]).
        order_by_col: if specified, instead of a simple `dropDuplicates`,
                       only one record per key is retained, using this
                       column as the sort criterion (ej. "ingestion_timestamp").
        keep: "last" o "first" — cuál registro conservar según order_by_col.
 
    Returns:
        DataFrame sin duplicados.
    """
    if order_by_col is None:
        return df.dropDuplicates(keys)
 
    order_expr = F.col(order_by_col).desc()
    window = Window.partitionBy(*keys).orderBy(order_expr)
 
    return (
        df.withColumn("_rn", F.row_number().over(window))
          .filter(F.col("_rn") == 1)
          .drop("_rn")
    )
 

