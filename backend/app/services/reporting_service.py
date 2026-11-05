"""
ReportLab PDF Generation Service
Generates professional climate intelligence and vulnerability assessment briefs.
"""

import io
import os
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/reports"))
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_district_pdf_report(district_data: Dict[str, Any]) -> bytes:
    """
    Builds a professional scientific climate assessment PDF report for a district.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette: Forest Green (#1B4332), Sage (#40916C), Muted Slate (#334155)
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1B4332"),
        fontName="Helvetica-Bold",
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#2D6A4F"),
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B")
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#065F46"),
        fontName="Helvetica-Oblique"
    )

    elements = []

    # Title & Header
    d_name = district_data.get("name", "District")
    s_name = district_data.get("state_name", "India")
    zone = district_data.get("zone", "Ecological Zone")
    pop = district_data.get("population", 0)

    elements.append(Paragraph(f"District Climate Vulnerability Assessment", title_style))
    elements.append(Paragraph(f"<b>District:</b> {d_name} &nbsp;|&nbsp; <b>State:</b> {s_name} &nbsp;|&nbsp; <b>Report Date:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2D6A4F"), spaceBefore=0, spaceAfter=8))

    # Architecture Distinction Callout
    notice_text = (
        "<b>SYSTEM NOTICE:</b> This scientific intelligence platform rigorously distinguishes between "
        "<b>(1) Baseline Climate Vulnerability</b> (multi-decadal exposure, sensitivity & adaptive deficit) and "
        "<b>(2) Real-time Hazard Monitoring</b> (Open-Meteo telemetry & official SDMA/NDMA warnings). "
        "These independent systems are reported separately below."
    )
    elements.append(Paragraph(notice_text, callout_style))
    elements.append(Spacer(1, 8))

    # 1. District Profile Overview Table
    v_info = district_data.get("vulnerability", {})
    v_score = v_info.get("vulnerability_score", 0.0)
    v_cat = v_info.get("vulnerability_category", "Unknown")
    e_score = v_info.get("exposure_score", 0.0)
    s_score = v_info.get("sensitivity_score", 0.0)
    a_score = v_info.get("adaptive_capacity_score", 0.0)
    conf = district_data.get("data_confidence", 95.0)

    overview_table_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value / Assessment</b>", body_style), Paragraph("<b>Reference Range</b>", body_style)],
        [Paragraph("Vulnerability Score (V)", body_style), Paragraph(f"<b>{v_score} / 100</b> ({v_cat})", body_style), Paragraph("0-20 Very Low to 81-100 Very High", body_style)],
        [Paragraph("Exposure Dimension (E)", body_style), Paragraph(f"{e_score} / 100", body_style), Paragraph("Weight: 40% (Rain, Flood, Heat, Drought)", body_style)],
        [Paragraph("Sensitivity Dimension (S)", body_style), Paragraph(f"{s_score} / 100", body_style), Paragraph("Weight: 30% (Density, Agri, Housing)", body_style)],
        [Paragraph("Adaptive Capacity (A)", body_style), Paragraph(f"{a_score} / 100", body_style), Paragraph("Weight: 30% (Health, Roads, Water, Literacy)", body_style)],
        [Paragraph("Adaptive Deficit (100 - A)", body_style), Paragraph(f"{round(100.0 - a_score, 1)} / 100", body_style), Paragraph("Residual infrastructural vulnerability", body_style)],
        [Paragraph("Total Population", body_style), Paragraph(f"{pop:,} persons", body_style), Paragraph("Census of India Baseline", body_style)],
        [Paragraph("Ecological Terrain", body_style), Paragraph(f"{zone}", body_style), Paragraph("Biogeographic Zone", body_style)],
        [Paragraph("Data Completeness Confidence", body_style), Paragraph(f"<b>{conf}%</b>", body_style), Paragraph(">60% Standard Scientific Confidence", body_style)],
    ]

    t1 = Table(overview_table_data, colWidths=[160, 180, 200])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#D8F3DC")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#1B4332")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 10))

    # 2. Subsystem 2: Real-time Weather & Hazard Monitoring
    elements.append(Paragraph("Current Environmental Hazards & Meteorological Observations", h2_style))
    cw = district_data.get("current_weather", {})
    temp = cw.get("temp_current_c", "N/A")
    rain = cw.get("rainfall_mm_24h", 0.0)
    cond = cw.get("weather_condition", "Fair")
    stn = cw.get("station_name", "Open-Meteo High-Res Grid")

    weather_table_data = [
        [Paragraph("<b>Parameter</b>", body_style), Paragraph("<b>Observation</b>", body_style), Paragraph("<b>Data Source & Authority</b>", body_style)],
        [Paragraph("Current Surface Temperature", body_style), Paragraph(f"{temp} °C", body_style), Paragraph(f"Open-Meteo Live Grid ({stn})", body_style)],
        [Paragraph("24-Hour Rainfall Accumulation", body_style), Paragraph(f"{rain} mm", body_style), Paragraph("Open-Meteo High-Resolution Precipitation", body_style)],
        [Paragraph("Sky / Weather Condition", body_style), Paragraph(f"{cond}", body_style), Paragraph("Numerical Weather Model Observation", body_style)],
    ]

    t2 = Table(weather_table_data, colWidths=[160, 180, 200])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E0F2FE")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0369A1")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 10))

    # 3. Active Government Warnings & Alerts
    alerts = district_data.get("active_alerts", [])
    elements.append(Paragraph("Official Weather Warnings & Advisories", h2_style))
    if alerts:
        alert_rows = [
            [Paragraph("<b>Type</b>", body_style), Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Details / Issuing Authority</b>", body_style)]
        ]
        for a in alerts:
            alert_rows.append([
                Paragraph(a.get("alert_type", "Warning"), body_style),
                Paragraph(f"<b>{a.get('severity', 'Notice')}</b>", body_style),
                Paragraph(f"{a.get('headline', '')} - <i>{a.get('issuing_authority', 'SDMA')}</i>", body_style)
            ])
        t3 = Table(alert_rows, colWidths=[130, 90, 320])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#FEF3C7")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t3)
    else:
        elements.append(Paragraph("<i>No active extreme weather warnings currently issued by SDMA for this district.</i>", body_style))

    elements.append(Spacer(1, 12))

    # 4. Scientific Methodology & Data Provenance Notice
    elements.append(Paragraph("Methodology, Limitations & Provenance", h2_style))
    notes = (
        "<b>Model Formula:</b> V = 0.40·E + 0.30·S + 0.30·(100 - A).<br/>"
        "<b>Datasets:</b> Open-Meteo Weather API, Copernicus ERA5, NASA FIRMS, Census of India 2011.<br/>"
        "<b>Academic Disclaimer:</b> This report is generated by the Community Climate Vulnerability Mapping Platform "
        "for academic research, local resilience planning and educational evaluation. It does not replace statutory "
        "disaster declarations promulgated by the National Disaster Management Authority (NDMA)."
    )
    elements.append(Paragraph(notes, ParagraphStyle('Notes', parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor("#64748B"))))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
