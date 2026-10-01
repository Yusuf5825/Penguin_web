from flask import Flask, render_template, request, jsonify
import torch
from torch import nn
import joblib
import numpy as np

app = Flask(__name__)

# 1. Model Mimarisi (Senin kodunla birebir aynı)
class PenguinMultiClassification(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear_layer_stack = nn.Sequential(
            nn.Linear(4, 16),
            nn.ReLU(),
            nn.Linear(16, 16),
            nn.ReLU(),
            nn.Linear(16, 16),
            nn.ReLU(),
            nn.Linear(16, 3)
        )
    def forward(self, x):
        return self.linear_layer_stack(x)

# 2. Model ve Scaler'ı Yükle
model = PenguinMultiClassification()
model.load_state_dict(torch.load('palmer_penguin_multi_classification.pth'))
model.eval()
scaler = joblib.load('scaler.pkl')
species_names = ['Adelie', 'Chinstrap', 'Gentoo']

# 3. Ana Sayfayı (HTML) Yükleme Rotası
@app.route('/')
def home():
    return render_template('index.html')

# 4. JS'den Gelen Tahmin İsteğini Karşılama Rotası
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # JS'den gelen JSON verisini al
        data = request.get_json()
        
        # DİKKAT: Buradaki sıralama, eğitim verisiyle (X_train) BİREBİR aynı olmalıdır.
        features = [
            float(data['culmen_depth']),   # 1. Gaga Uzunluğu
            float(data['culmen_length']),    # 2. Gaga Kalınlığı
            float(data['flipper_length']),  # 3. Kanat Uzunluğu
            float(data['body_mass'])        # 4. Vücut Ağırlığı
        ]
        
        input_data = np.array([features])
        scaled_data = scaler.transform(input_data)
        tensor_data = torch.as_tensor(scaled_data, dtype=torch.float32)
        
        # Tahmin yap
        with torch.inference_mode():
            logits = model(tensor_data)
            probabilities = torch.softmax(logits, dim=1)[0] * 100
            
            predicted_class = torch.argmax(probabilities).item()
            predicted_species = species_names[predicted_class]
            
            # Yüzdeleri sözlük formatına getir
            prob_dict = {species_names[i]: round(probabilities[i].item(), 2) for i in range(3)}
            
        return jsonify({
            'success': True,
            'prediction': predicted_species,
            'probabilities': prob_dict
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)