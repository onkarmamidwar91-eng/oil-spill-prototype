from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import pipeline

app = FastAPI(
    title="Oil Spill Detection & Ship Tracing API",
    description=(
        "Prototype API for SIH 2026 PS ID SIH26143. Simulates the "
        "detect -> reverse-drift -> AIS-match -> suspect-score pipeline "
        "over mock SAR and AIS data so the full workflow can be "
        "demonstrated without live satellite/AIS feeds."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "oil-spill-prototype-api", "docs": "/docs"}
