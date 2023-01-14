from fastapi import APIRouter, HTTPException, Query

from app.services import coingecko

router = APIRouter()


@router.get("/api/prices")
def prices(ids: str = Query(...)):
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if not id_list:
        raise HTTPException(status_code=400, detail="ids required")

    try:
        return coingecko.simple_price(id_list)
    except coingecko.UpstreamError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
