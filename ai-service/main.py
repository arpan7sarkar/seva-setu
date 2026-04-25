from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import io

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
MODEL_ID = "openai/clip-vit-base-patch32"
print(f"Loading model {MODEL_ID}...")
model = CLIPModel.from_pretrained(MODEL_ID)
processor = CLIPProcessor.from_pretrained(MODEL_ID)
print("Model loaded successfully.")

DISASTER_LABELS = [
    "a photo of a flood",
    "a photo of a fire",
    "a photo of a medical emergency",
    "a photo of a destroyed building",
    "a photo of an accident",
    "a photo of people needing help",
    "a photo of a natural disaster",
    "a normal photo with no disaster",
]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL_ID}

@app.post("/verify-image")
async def verify_image(file: UploadFile = File(...)):
    try:
        # Read image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Prepare inputs
        inputs = processor(
            text=DISASTER_LABELS, 
            images=image, 
            return_tensors="pt", 
            padding=True
        )

        # Inference
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        
        # Get results
        results = []
        for i, label in enumerate(DISASTER_LABELS):
            results.append({
                "label": label,
                "confidence": float(probs[0][i])
            })
            
        # Sort by confidence
        results = sorted(results, key=lambda x: x["confidence"], reverse=True)
        
        # Determine if it's a disaster
        top_result = results[0]
        # Stricter check: Must not be "normal photo" AND confidence must be significantly higher
        is_disaster = (top_result["label"] != "a normal photo with no disaster") and (top_result["confidence"] > 0.45)
        
        return {
            "is_verified": is_disaster,
            "top_match": top_result["label"],
            "confidence": top_result["confidence"],
            "all_results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
