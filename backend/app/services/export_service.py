"""
Export Service
Exports climate vulnerability indicators, hazards, and observations to CSV and Excel (openpyxl).
"""

import io
from typing import List, Dict, Any
import pandas as pd

def export_districts_to_csv(districts_data: List[Dict[str, Any]]) -> bytes:
    """Exports district climate vulnerability records to CSV format."""
    df = pd.DataFrame(districts_data)
    csv_str = df.to_csv(index=False)
    return csv_str.encode("utf-8")

def export_districts_to_excel(districts_data: List[Dict[str, Any]]) -> bytes:
    """Exports district climate vulnerability records to multi-sheet Excel format."""
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df_districts = pd.DataFrame(districts_data)
        df_districts.to_excel(writer, sheet_name="District Vulnerability", index=False)
        
        # Methodology summary sheet
        methodology = [
            {"Parameter": "Platform", "Value": "Community Climate Vulnerability Mapping (India)"},
            {"Parameter": "IPCC Formula", "Value": "V = 0.40*E + 0.30*S + 0.30*(100 - A)"},
            {"Parameter": "Exposure (E) Weight", "Value": "40%"},
            {"Parameter": "Sensitivity (S) Weight", "Value": "30%"},
            {"Parameter": "Adaptive Capacity (A) Weight", "Value": "30%"},
            {"Parameter": "Categories", "Value": "0-20 Very Low, 21-40 Low, 41-60 Moderate, 61-80 High, 81-100 Very High"},
            {"Parameter": "Primary Sources", "Value": "Open-Meteo, NASA FIRMS, Copernicus ERA5, Census India, SDMA/NDMA"}
        ]
        pd.DataFrame(methodology).to_excel(writer, sheet_name="Methodology & Metadata", index=False)
        
    buffer.seek(0)
    return buffer.getvalue()
