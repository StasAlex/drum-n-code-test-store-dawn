document.addEventListener('DOMContentLoaded', function() {
    // Получаем данные о вариантах
    const variantsScript = document.getElementById('variants-data');
    if (!variantsScript) return;
    const variants = JSON.parse(variantsScript.textContent);
    const variantIdInput = document.getElementById('variant-id');
    const priceBox = document.getElementById('event-price');
    const buyBtn = document.getElementById('event-buy-btn');
    const optionGroups = document.querySelectorAll('.variant-group');
    const optionCount = optionGroups.length;
    let selectedOptions = [];

    // Установка дефолтных значений
    optionGroups.forEach((group, idx) => {
        const firstBtn = group.querySelector('.variant-btn');
        if (firstBtn) {
            firstBtn.classList.add('active');
            selectedOptions[idx] = firstBtn.dataset.value;
        }
    });

    function findVariant() {
        return variants.find(v => {
            for (let i = 0; i < optionCount; i++) {
                if (v['option' + (i+1)] !== selectedOptions[i]) return false;
            }
            return true;
        });
    }

    function updateButtonState(variant) {
        if (!buyBtn) return;
        if (variant && !variant.available) {
            buyBtn.disabled = true;
            buyBtn.innerText = "Продано";
            buyBtn.classList.add('soldout');
        } else {
            buyBtn.disabled = false;
            buyBtn.innerText = "Купити";
            buyBtn.classList.remove('soldout');
        }
    }

    // Клик по варианту
    document.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const optionIdx = parseInt(this.dataset.optionIndex, 10);
            this.parentNode.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedOptions[optionIdx] = this.dataset.value;
            const found = findVariant();
            if (found) {
                variantIdInput.value = found.id;
                if(priceBox) priceBox.innerText = found.price;
                updateButtonState(found);
            }
        });
    });

    // Инициализация
    updateButtonState(findVariant());

    // --- Остальной JS (форма и отправка) ---
    const form = document.getElementById('event-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            let valid = true;
            let msg = '';
            form.querySelectorAll('input[required], select[required]').forEach(input => {
                if (!input.value.trim()) { valid = false; msg = 'Please fill all required fields.'; }
            });
            if (!valid) {
                document.getElementById('event-form-error').style.display = '';
                document.getElementById('event-form-error').innerText = msg;
                return;
            } else {
                document.getElementById('event-form-error').style.display = 'none';
            }
            const fd = new FormData(form);
            fetch('/cart/add.js', {
                method: 'POST',
                body: fd,
                headers: { 'Accept': 'application/json' }
            }).then(res => res.json())
                .then(data => {
                    if (data.status && data.status !== 200) {
                        document.getElementById('event-form-error').style.display = '';
                        document.getElementById('event-form-error').innerText = data.description || 'Ошибка при добавлении товара.';
                        return;
                    }
                    document.getElementById('event-form-error').style.display = 'none';
                    let info = document.createElement('div');
                    info.innerText = "Товар додано! Переходимо до чекауту...";
                    info.style = "color:green;margin:10px 0;font-weight:600;";
                    form.parentNode.insertBefore(info, form);
                    setTimeout(() => {
                        window.location = '/checkout';
                    }, 1200);
                })
                .catch(err => {
                    document.getElementById('event-form-error').style.display = '';
                    document.getElementById('event-form-error').innerText = 'Помилка додавання у кошик. Спробуйте ще раз.';
                });
        });
    }
});