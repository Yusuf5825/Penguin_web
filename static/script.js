async function makePrediction() {
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const btn = document.getElementById('predict-btn');
    const resultBox = document.getElementById('result-box');

    // 1. Girdileri Al
    const inputData = {
        culmen_length: document.getElementById('culmen_length').value,
        culmen_depth: document.getElementById('culmen_depth').value,
        flipper_length: document.getElementById('flipper_length').value,
        body_mass: document.getElementById('body_mass').value
    };

    // 2. Yükleniyor Animasyonu Başlat
    btn.disabled = true;
    btnText.innerText = "Yapay Zeka Hesaplarken Bekleyin...";
    btnIcon.className = "fa-solid fa-circle-notch fa-spin";
    resultBox.classList.add('hidden');

    try {
        // 3. Sunucuya İstek At
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputData)
        });

        const result = await response.json();

        // 4. Sonuçları Ekrana Yazdır
        if (result.success) {
            resultBox.classList.remove('hidden');
            document.getElementById('predicted-species').innerText = result.prediction;

            const probContainer = document.getElementById('probabilities-container');
            probContainer.innerHTML = ''; 

            // Türlere göre CSS sınıfları (renkler için)
            const colorClasses = {
                'Adelie': 'bar-adelie',
                'Chinstrap': 'bar-chinstrap',
                'Gentoo': 'bar-gentoo'
            };

            for (const [species, probability] of Object.entries(result.probabilities)) {
                const barClass = colorClasses[species] || 'bar-adelie';
                
                probContainer.innerHTML += `
                    <div class="prob-item">
                        <div class="prob-header">
                            <span>${species}</span>
                            <span>%${probability.toFixed(1)}</span>
                        </div>
                        <div class="prob-bar-container">
                            <!-- Genişlik 0'dan başlıyor, CSS animasyonu ile dolacak -->
                            <div class="prob-bar ${barClass}" style="width: 0%"></div>
                        </div>
                    </div>
                `;
            }

            // Animasyonun tetiklenmesi için küçük bir gecikme ekliyoruz
            setTimeout(() => {
                const bars = document.querySelectorAll('.prob-bar');
                let i = 0;
                for (const [species, probability] of Object.entries(result.probabilities)) {
                    bars[i].style.width = `${probability}%`;
                    i++;
                }
            }, 50);

        } else {
            alert("Hata: " + result.error);
        }
    } catch (error) {
        console.error("Hata:", error);
        alert("Sunucuya ulaşılamadı. Flask çalışıyor mu?");
    } finally {
        // 5. Butonu Eski Haline Getir
        btn.disabled = false;
        btnText.innerText = "Tahmin Et";
        btnIcon.className = "fa-solid fa-wand-magic-sparkles";
    }
}