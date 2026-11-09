"""
Request and response shapes (Pydantic). These ARE the API contract in code:
FastAPI uses them to validate input (bad input -> 422) and to build /docs.
Keep them in sync with CONTRACT.md.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AppCategory = Literal["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Bags", "Accessories"]
Slot = Literal["Top", "Bottom", "Shoes", "Accessory"]


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")  # unknown fields -> 422

    name: str = Field(..., min_length=1, max_length=200,
                      description="What the user calls the item", examples=["Black leather ankle boots"])
    description: str | None = Field(None, max_length=2000,
                                    description="Optional extra detail", examples=["Block heel, side zip"])

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v


class ClassProbability(BaseModel):
    category: str
    probability: float = Field(..., ge=0, le=1)


class PredictResponse(BaseModel):
    category: str = Field(..., description="Raw model label, one of the 11 Polyvore categories")
    app_category: AppCategory = Field(..., description="Frontend category (lib/types.ts)")
    slots: list[Slot] = Field(..., description="Outfit slots this item can fill")
    confidence: float = Field(..., ge=0, le=1)
    top_3: list[ClassProbability]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model_loaded: bool


class PipelineInfo(BaseModel):
    model_name: str
    model_version: str
    sklearn_version: str
    classes: list[str]
    is_stub: bool = Field(..., description="True while the placeholder keyword model is running")
    metrics: dict[str, float] = Field(default_factory=dict, description="Validation metrics from D3")
