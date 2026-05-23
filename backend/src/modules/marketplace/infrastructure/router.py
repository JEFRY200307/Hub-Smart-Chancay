from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session, select, func

from src.shared.infrastructure.database import get_session
from src.shared.infrastructure.pagination import PaginatedResponse
from src.shared.domain.exceptions import DomainException, ResourceNotFoundException
from src.modules.zeep_ingestion.domain.entities import Company, StructuredOpportunity
from src.modules.identity.infrastructure.auth_dependency import get_current_user, get_optional_user, require_roles
from src.modules.identity.domain.entities import User

from ..application.dtos import (
    ZEEPOpportunityDTO,
    OperatorDTO,
    MatchRequestDTO,
    MatchResponseDTO,
    ReunionRequestDTO,
    ReunionResponseDTO,
    EngineerDirectoryItemDTO,
    LawyerDirectoryItemDTO,
    ProviderDirectoryItemDTO,
    EngineerDetailDTO,
    LawyerDetailDTO,
    ProviderDetailDTO,
    EnrichmentMetaDTO,
)
from ..application.matchmaking_service import MatchmakingService
from ..domain.entities import EngineerCIP, LawyerCAL

router = APIRouter(prefix="/api/v1/marketplace", tags=["Matchmaking"])


@router.post("/matches", response_model=MatchResponseDTO)
async def create_matches(
    payload: MatchRequestDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = MatchmakingService(session)
    try:
        return svc.run_match(payload)
    except ValueError as e:
        if str(e) == "profile_not_found":
            raise ResourceNotFoundException("InvestorProfile", str(payload.investor_profile_id))
        raise DomainException(
            title="Unprocessable Entity",
            detail="El perfil archivado no puede generar matches.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


@router.get("/matches/{match_id}", response_model=MatchResponseDTO)
async def get_match(
    match_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    svc = MatchmakingService(session)
    result = svc.get_match(match_id)
    if not result:
        raise ResourceNotFoundException("MatchResult", str(match_id))
    return result


@router.post("/matches/{match_id}/reuniones", response_model=ReunionResponseDTO, status_code=status.HTTP_201_CREATED)
async def request_reunion(
    match_id: uuid.UUID,
    payload: ReunionRequestDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = MatchmakingService(session)
    try:
        return svc.request_reunion(match_id, payload, current_user.id)
    except ValueError:
        raise ResourceNotFoundException("MatchCandidato", str(payload.candidato_id))


@router.get("/directory/engineers", response_model=PaginatedResponse[EngineerDirectoryItemDTO])
async def list_engineers(
    especialidad: Optional[str] = Query(None),
    idioma: Optional[str] = Query(None),
    disponibilidad: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    stmt = select(EngineerCIP).where(EngineerCIP.marketplace_visible.is_(True))
    if especialidad:
        stmt = stmt.where(EngineerCIP.especialidad_principal.ilike(f"%{especialidad}%"))
    if disponibilidad:
        stmt = stmt.where(EngineerCIP.disponibilidad == disponibilidad)
    if idioma:
        stmt = stmt.where(EngineerCIP.idiomas.contains([idioma]))

    count_stmt = select(func.count()).select_from(EngineerCIP).where(EngineerCIP.marketplace_visible.is_(True))
    if especialidad:
        count_stmt = count_stmt.where(EngineerCIP.especialidad_principal.ilike(f"%{especialidad}%"))
    if disponibilidad:
        count_stmt = count_stmt.where(EngineerCIP.disponibilidad == disponibilidad)
    total = session.exec(count_stmt).one()
    rows = session.exec(stmt.offset((page - 1) * size).limit(size)).all()

    items = [
        EngineerDirectoryItemDTO(
            id=r.id,
            nombre=r.nombre_completo,
            numero_cip=r.numero_cip,
            especialidades=list(r.especialidades or []) if isinstance(r.especialidades, list) else [],
            disponibilidad=r.disponibilidad,
            idiomas=list(r.idiomas or []),
            habilitacion_vigente=r.habilitacion_vigente,
            rating_promedio=float(r.rating_promedio) if r.rating_promedio else None,
            foto_url=r.foto_url,
            especialidad_principal=r.especialidad_principal,
            descripcion_publica=r.descripcion_publica,
        )
        for r in rows
    ]
    return PaginatedResponse.build(items, total, page, size)


@router.get("/directory/lawyers", response_model=PaginatedResponse[LawyerDirectoryItemDTO])
async def list_lawyers(
    especializacion: Optional[str] = Query(None),
    certificacion_zeep: Optional[bool] = Query(None),
    idioma: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    stmt = select(LawyerCAL).where(LawyerCAL.marketplace_visible.is_(True))
    if especializacion:
        stmt = stmt.where(LawyerCAL.especializacion_principal.ilike(f"%{especializacion}%"))
    if certificacion_zeep is not None:
        stmt = stmt.where(LawyerCAL.certificacion_zeep == certificacion_zeep)
    if idioma:
        stmt = stmt.where(LawyerCAL.idiomas.contains([idioma]))

    count_stmt = select(func.count()).select_from(LawyerCAL).where(LawyerCAL.marketplace_visible.is_(True))
    if especializacion:
        count_stmt = count_stmt.where(LawyerCAL.especializacion_principal.ilike(f"%{especializacion}%"))
    if certificacion_zeep is not None:
        count_stmt = count_stmt.where(LawyerCAL.certificacion_zeep == certificacion_zeep)
    total = session.exec(count_stmt).one()
    rows = session.exec(stmt.offset((page - 1) * size).limit(size)).all()

    items = [
        LawyerDirectoryItemDTO(
            id=r.id,
            nombre=r.nombre_completo,
            numero_cal=r.numero_cal,
            especializaciones=list(r.especializaciones or []) if isinstance(r.especializaciones, list) else [],
            certificacion_zeep=r.certificacion_zeep,
            idiomas=list(r.idiomas or []),
            habilitacion_vigente=r.habilitacion_vigente,
            rating_promedio=float(r.rating_promedio) if r.rating_promedio else None,
            especializacion_principal=r.especializacion_principal,
            descripcion_publica=r.descripcion_publica,
        )
        for r in rows
    ]
    return PaginatedResponse.build(items, total, page, size)


@router.get("/directory/providers", response_model=PaginatedResponse[ProviderDirectoryItemDTO])
async def list_providers(
    sector: Optional[str] = Query(None),
    distancia_max_km: Optional[float] = Query(None),
    trust_score_min: Optional[float] = Query(None, ge=0, le=1),
    solo_habido: bool = Query(True),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    stmt = select(Company).where(Company.marketplace_visible.is_(True))
    if sector:
        stmt = stmt.where(Company.sector_interno == sector)
    if solo_habido:
        stmt = stmt.where(Company.condicion_contribuyente == "HABIDO")
    if trust_score_min is not None:
        stmt = stmt.where(Company.trust_score >= trust_score_min)
    if distancia_max_km is not None:
        stmt = stmt.where(Company.distancia_puerto_chancay_km <= distancia_max_km)

    count_stmt = select(func.count()).select_from(Company).where(Company.marketplace_visible.is_(True))
    if sector:
        count_stmt = count_stmt.where(Company.sector_interno == sector)
    if solo_habido:
        count_stmt = count_stmt.where(Company.condicion_contribuyente == "HABIDO")
    if trust_score_min is not None:
        count_stmt = count_stmt.where(Company.trust_score >= trust_score_min)
    total = session.exec(count_stmt).one()
    rows = session.exec(stmt.offset((page - 1) * size).limit(size)).all()

    items = [
        ProviderDirectoryItemDTO(
            ruc=r.ruc,
            razon_social=r.razon_social,
            sector_interno=r.sector_interno,
            estado_sunarp=r.estado_sunarp,
            condicion_contribuyente=r.condicion_contribuyente,
            trust_score=float(r.trust_score) if r.trust_score else None,
            capacidad_operativa=r.capacidad_operativa,
            distancia_puerto_chancay_km=float(r.distancia_puerto_chancay_km)
            if r.distancia_puerto_chancay_km
            else None,
            tiene_cargas=r.tiene_cargas,
            marketplace_visible=r.marketplace_visible,
            descripcion_publica=r.descripcion_publica,
        )
        for r in rows
    ]
    return PaginatedResponse.build(items, total, page, size)


def _enrichment_score(has_desc: bool, has_contact: bool, validated: bool) -> EnrichmentMetaDTO:
    score = 0.4
    fuentes = ["bd"]
    if has_desc:
        score += 0.25
    if has_contact:
        score += 0.2
    if validated:
        score += 0.15
    return EnrichmentMetaDTO(completeness_score=min(score, 1.0), fuentes=fuentes)


@router.get("/directory/engineers/{engineer_id}", response_model=EngineerDetailDTO)
async def get_engineer_detail(
    engineer_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    row = session.get(EngineerCIP, engineer_id)
    if not row or not row.marketplace_visible:
        raise ResourceNotFoundException("EngineerCIP", str(engineer_id))
    certs: list[str] = []
    if isinstance(row.cv_data, dict):
        raw = row.cv_data.get("certificaciones", [])
        if isinstance(raw, list):
            certs = [str(c) for c in raw]
    return EngineerDetailDTO(
        id=row.id,
        nombre=row.nombre_completo,
        numero_cip=row.numero_cip,
        especialidades=list(row.especialidades or []) if isinstance(row.especialidades, list) else [],
        disponibilidad=row.disponibilidad,
        idiomas=list(row.idiomas or []),
        habilitacion_vigente=row.habilitacion_vigente,
        rating_promedio=float(row.rating_promedio) if row.rating_promedio else None,
        foto_url=row.foto_url,
        especialidad_principal=row.especialidad_principal,
        descripcion_publica=row.descripcion_publica,
        region=row.region,
        ciudad=row.ciudad,
        experiencia_zeep=row.experiencia_zeep,
        anos_experiencia=row.anos_experiencia,
        certificaciones=certs,
        enrichment=_enrichment_score(
            bool(row.descripcion_publica),
            bool(row.linkedin_url or row.sitio_web),
            row.habilitacion_vigente,
        ),
    )


@router.get("/directory/lawyers/{lawyer_id}", response_model=LawyerDetailDTO)
async def get_lawyer_detail(
    lawyer_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    row = session.get(LawyerCAL, lawyer_id)
    if not row or not row.marketplace_visible:
        raise ResourceNotFoundException("LawyerCAL", str(lawyer_id))
    return LawyerDetailDTO(
        id=row.id,
        nombre=row.nombre_completo,
        numero_cal=row.numero_cal,
        especializaciones=list(row.especializaciones or []) if isinstance(row.especializaciones, list) else [],
        certificacion_zeep=row.certificacion_zeep,
        idiomas=list(row.idiomas or []),
        habilitacion_vigente=row.habilitacion_vigente,
        rating_promedio=float(row.rating_promedio) if row.rating_promedio else None,
        especializacion_principal=row.especializacion_principal,
        descripcion_publica=row.descripcion_publica,
        region=row.region,
        ciudad=row.ciudad,
        anos_experiencia=row.anos_experiencia,
        enrichment=_enrichment_score(
            bool(row.descripcion_publica),
            bool(row.linkedin_url or row.sitio_web_estudio),
            row.habilitacion_vigente,
        ),
    )


@router.get("/directory/providers/{ruc}", response_model=ProviderDetailDTO)
async def get_provider_detail(
    ruc: str,
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    row = session.get(Company, ruc)
    if not row or not row.marketplace_visible:
        raise ResourceNotFoundException("Company", ruc)
    web = row.web_enrichment_data if isinstance(row.web_enrichment_data, dict) else {}
    has_contact = bool(web.get("contacto") or web.get("fuente_url"))
    return ProviderDetailDTO(
        ruc=row.ruc,
        razon_social=row.razon_social,
        sector_interno=row.sector_interno,
        estado_sunarp=row.estado_sunarp,
        condicion_contribuyente=row.condicion_contribuyente,
        trust_score=float(row.trust_score) if row.trust_score else None,
        capacidad_operativa=row.capacidad_operativa,
        distancia_puerto_chancay_km=float(row.distancia_puerto_chancay_km)
        if row.distancia_puerto_chancay_km
        else None,
        tiene_cargas=row.tiene_cargas,
        marketplace_visible=row.marketplace_visible,
        descripcion_publica=row.descripcion_publica,
        ciiu_principal=row.ciiu_principal,
        servicios_principales=list(row.servicios_principales or []),
        web_enrichment_data=web or None,
        directorio=list(row.directorio or []) if row.directorio else None,
        enrichment=_enrichment_score(
            bool(row.descripcion_publica or web.get("descripcion_publica")),
            has_contact,
            row.estado_sunarp == "ACTIVA",
        ),
    )


@router.post("/directory/providers/{ruc}/enrich", response_model=ProviderDetailDTO)
async def enrich_provider(
    ruc: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    row = session.get(Company, ruc)
    if not row:
        raise ResourceNotFoundException("Company", ruc)
    web = dict(row.web_enrichment_data or {})
    try:
        import os
        from datetime import datetime

        api_key = os.getenv("TAVILY_API_KEY")
        if api_key:
            from tavily import TavilyClient

            client = TavilyClient(api_key=api_key)
            q = f"{row.razon_social} RUC {ruc} Perú sitio web contacto"
            results = client.search(query=q, max_results=3, include_domains=None)
            for hit in results.get("results", [])[:2]:
                web.setdefault("fuentes", []).append(hit.get("url"))
                if not web.get("descripcion_publica") and hit.get("content"):
                    web["descripcion_publica"] = hit["content"][:2000]
            web["fecha_scraping"] = datetime.utcnow().isoformat()
            web["enriched_by"] = str(current_user.id)
            row.web_enrichment_data = web
            session.add(row)
            session.commit()
            session.refresh(row)
    except Exception:
        pass
    return await get_provider_detail(ruc, session, current_user)


# ── Endpoints legacy (compatibilidad frontend existente) ─────────────────────

@router.get("/operators", response_model=list[OperatorDTO])
async def list_operators(
    sector: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Company).where(Company.marketplace_visible.is_(True))
    if sector:
        stmt = stmt.where(Company.sector_interno == sector)
    results = session.exec(stmt.limit(limit)).all()
    if not results:
        return [
            OperatorDTO(
                id="20601234567",
                name="LogiChancay S.A.C.",
                tier="Tier 1 Partner",
                description="Especialistas en logística portuaria ZEEP.",
                services=["DTA", "Almacenaje"],
                rating=4.9,
                verified=True,
            )
        ]
    return [
        OperatorDTO(
            id=c.ruc,
            name=c.razon_social,
            tier="Tier 1" if c.trust_score and float(c.trust_score) >= 0.75 else "Tier 2",
            description=c.descripcion_publica or "Proveedor validado SUNARP/SUNAT",
            services=list(c.servicios_principales or []),
            rating=float(c.trust_score * 5) if c.trust_score else 3.5,
            verified=c.estado_contribuyente == "ACTIVO",
        )
        for c in results
    ]


@router.get("/opportunities", response_model=list[ZEEPOpportunityDTO])
async def list_opportunities(
    limit: int = Query(20, le=100),
    session: Session = Depends(get_session),
    _: User | None = Depends(get_optional_user),
):
    results = session.exec(
        select(StructuredOpportunity).order_by(StructuredOpportunity.created_at.desc()).limit(limit)
    ).all()
    if not results:
        return [
            ZEEPOpportunityDTO(
                id="opp-demo-1",
                title="Expansión Cold Chain ZEEP",
                category="CONVOCATORIA",
                match_score=98,
                description="Convocatoria logística refrigerada Puerto Chancay.",
                tags=["ZEEP", "Logística"],
                company_name="MINCETUR",
                posted_ago="Reciente",
            )
        ]
    return [
        ZEEPOpportunityDTO(
            id=str(o.id),
            title=o.titulo or "Sin título",
            category=o.tipo or "GENERAL",
            description=o.descripcion or "",
            tags=[e for e in o.entidades_mencionadas if isinstance(e, str)],
            company_name=o.fuente or "ZEEP Chancay",
            posted_ago=str(o.fecha_publicacion) if o.fecha_publicacion else "Reciente",
        )
        for o in results
    ]
