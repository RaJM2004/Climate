from fastapi import APIRouter
from app.api.v1.endpoints import (
    states,
    districts,
    map_layers,
    analytics,
    alerts,
    reports,
    data_sources,
    admin,
    auth
)

api_router = APIRouter()

api_router.include_router(states.router, prefix="/states", tags=["States"])
api_router.include_router(districts.router, prefix="/districts", tags=["Districts"])
api_router.include_router(map_layers.router, prefix="/map", tags=["Interactive Map Layers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Comparison"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts & Notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Downloads"])
api_router.include_router(data_sources.router, prefix="/data-sources", tags=["Data Sources"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
