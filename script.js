class OrderDashboard {
    constructor() {
        this.orderItems = [];
        this.isAnimatingRemoveAll = false;

        // Configure service charge and GST rates here
        this.serviceChargeRate = 0.10; // 10%
        this.gstRate = 0.09; // 9%

        this.init();
    }

    init() {
        this.bindEvents();
        this.bindPopupEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const products = document.querySelectorAll('.frame-11');
        products.forEach((product, index) => {
            const productImage = product.querySelector('.frame-12, .frame-18, .frame-19, .image-wrapper');
            const priceElement = product.querySelector('.text-wrapper-5');

            if (productImage && priceElement) {
                productImage.addEventListener('click', () => {
                    if (!this.isAnimatingRemoveAll) this.addToOrder(index);
                });

                priceElement.addEventListener('click', () => {
                    if (!this.isAnimatingRemoveAll) this.addToOrder(index);
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (this.isAnimatingRemoveAll) return;

            if (e.target.closest('.frame-27')) {
                const orderItem = e.target.closest('article');
                if (orderItem) {
                    const index = Array.from(orderItem.parentElement.children).indexOf(orderItem) - 1;
                    if (index >= 0) this.removeFromOrder(index);
                } else {
                    const customSubmit = e.target.closest('.custom-amount-submit');
                    if (customSubmit) this.submitCustomAmount();
                }
            }
        });

        const customAmountInput = document.getElementById('custom-amount');
        if (customAmountInput) {
            customAmountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.submitCustomAmount();
            });
        }
    }

    bindPopupEvents() {
        const viewButton = document.querySelector('.frame-5');
        const popup = document.querySelector('.cost-popup');
        const closeBtn = popup.querySelector('.close-popup');

        viewButton.addEventListener('click', () => {
            if (!this.isAnimatingRemoveAll) {
                this.updateDisplay();
                this.showPopup();
            }
        });

        closeBtn.addEventListener('click', () => this.hidePopup());
        popup.addEventListener('click', (e) => {
            if (e.target === popup) this.hidePopup();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.classList.contains('show')) this.hidePopup();
        });
    }

    showPopup() {
        const popup = document.querySelector('.cost-popup');
        popup.style.display = 'flex';
        popup.offsetHeight;
        popup.classList.add('show');
    }

    hidePopup() {
        const popup = document.querySelector('.cost-popup');
        popup.classList.remove('show');
        setTimeout(() => { popup.style.display = 'none'; }, 300);
    }

    getProductInfo(index) {
        const products = [
            { name: 'Red Plate', price: 2.30 },
            { name: 'Silver Plate', price: 2.90 },
            { name: 'Gold Plate', price: 3.90 },
            { name: 'Black Plate', price: 4.90 }
        ];
        return products[index] || { name: 'Unknown Item', price: 0 };
    }

    addToOrder(productIndex) {
        const product = this.getProductInfo(productIndex);

        const existingItemIndex = this.orderItems.findIndex(item => item.name === product.name);

        if (existingItemIndex >= 0) {
            this.orderItems[existingItemIndex].quantity += 1;
        } else {
            this.orderItems.push({ name: product.name, price: product.price, quantity: 1 });
        }

        this.updateDisplay();
    }

    removeFromOrder(index) {
        if (index >= 0 && index < this.orderItems.length) {
            this.orderItems[index].quantity -= 1;
            if (this.orderItems[index].quantity <= 0) this.orderItems.splice(index, 1);
            this.updateDisplay();
        }
    }

    submitCustomAmount() {
        const input = document.getElementById('custom-amount');
        if (!input) return;

        let value = input.value.trim();
        if (value.startsWith('$')) value = value.substring(1);

        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than $0.00');
            return;
        }

        const itemName = `$${amount.toFixed(2)} Item`;
        const existingIndex = this.orderItems.findIndex(i => i.name === itemName && i.price === amount);

        if (existingIndex >= 0) {
            this.orderItems[existingIndex].quantity += 1;
        } else {
            this.orderItems.push({ name: itemName, price: amount, quantity: 1 });
        }

        input.value = '';
        this.updateDisplay();
    }

    calculateTotalBeforeTax() {
        return this.orderItems.reduce((total, i) => total + i.price * i.quantity, 0);
    }

    calculateServiceCharge() { return this.calculateTotalBeforeTax() * this.serviceChargeRate; }
    calculateGST() { return (this.calculateTotalBeforeTax() + this.calculateServiceCharge()) * this.gstRate; }
    calculateTotalAfterTax() { return this.calculateTotalBeforeTax() + this.calculateServiceCharge() + this.calculateGST(); }

    updateDisplay() {
        const beforeTax = this.calculateTotalBeforeTax();
        const service = this.calculateServiceCharge();
        const gst = this.calculateGST();
        const afterTax = this.calculateTotalAfterTax();

        document.querySelectorAll('.before-tax').forEach(el => el.textContent = `$${beforeTax.toFixed(2)}`);
        document.querySelectorAll('.service-charge').forEach(el => el.textContent = `$${service.toFixed(2)}`);
        document.querySelectorAll('.gst').forEach(el => el.textContent = `$${gst.toFixed(2)}`);
        document.querySelectorAll('.text-wrapper-3, .after-tax').forEach(el => el.textContent = `$${afterTax.toFixed(2)}`);

        const products = [
            { name: 'Red Plate' },
            { name: 'Silver Plate' },
            { name: 'Gold Plate' },
            { name: 'Black Plate' }
        ];
        const quantityControls = document.querySelectorAll('.frame-14');
        products.forEach((product, idx) => {
            const item = this.orderItems.find(i => i.name === product.name);
            const count = item ? item.quantity : 0;
            const qEl = quantityControls[idx].querySelector('.frame-16 .text-wrapper-6');
            if (qEl) qEl.textContent = count;
        });

        this.updateOrderHistory();
    }

    updateOrderHistory() {
        const container = document.querySelector('.frame-23');
        const header = container.querySelector('.frame-24');

        // clear old items
        [...container.querySelectorAll('article, .empty-state')].forEach(e => e.remove());

        if (this.orderItems.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No items yet';
            container.appendChild(empty);
        } else {
            this.orderItems.forEach((item, idx) => {
                container.appendChild(this.createOrderItemElement(item, idx));
            });
        }

        const removeAllBtn = header.querySelector('.text-wrapper-8');
        removeAllBtn.textContent = "Remove All";
        removeAllBtn.style.display = this.orderItems.length ? 'block' : 'none';
        removeAllBtn.classList.remove('remove-all-removing');

        removeAllBtn.onclick = () => document.getElementById('removeAllPopup').classList.add('show');
        document.getElementById('cancelRemoveAll').onclick = () => document.getElementById('removeAllPopup').classList.remove('show');

        document.getElementById('confirmRemoveAll').onclick = () => this.animateRemoveAll();

        this.updateOrderHistoryFade();

        // attach scroll listener for fade
        container.addEventListener('scroll', () => this.updateOrderHistoryFade());
    }

    updateOrderHistoryFade() {
        const container = document.querySelector('.frame-23');
        if (!container) return;

        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

        container.style.setProperty('--fade-opacity', distanceFromBottom > 0 ? 1 : 0);
    }

    animateRemoveAll() {
        const container = document.querySelector('.frame-23');
        const items = [...container.querySelectorAll('article')];
        const removeAllBtn = container.querySelector('.text-wrapper-8');
        const plateCounters = document.querySelectorAll('.frame-16 .text-wrapper-6');

        document.getElementById('removeAllPopup').classList.remove('show');

        const dashboard = this;
        const originalAdd = dashboard.addToOrder;
        dashboard.addToOrder = () => {};

        const totalBefore = dashboard.calculateTotalBeforeTax();
        const serviceBefore = dashboard.calculateServiceCharge();
        const gstBefore = dashboard.calculateGST();
        const totalAfterBefore = dashboard.calculateTotalAfterTax();
        const plateValues = Array.from(plateCounters).map(c => parseInt(c.textContent));

        items.forEach((item, idx) => { item.style.animationDelay = `${idx * 0.1}s`; item.classList.add('order-removing'); });
        removeAllBtn.classList.add('remove-all-removing');

        const duration = 600;
        const startTime = performance.now();

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3) * Math.cos(progress * Math.PI * 2.5);

            document.querySelector('.text-wrapper-3').textContent = `$${(totalBefore * (1 - ease)).toFixed(2)}`;
            document.querySelector('.service-charge').textContent = `$${(serviceBefore * (1 - ease)).toFixed(2)}`;
            document.querySelector('.gst').textContent = `$${(gstBefore * (1 - ease)).toFixed(2)}`;
            document.querySelector('.after-tax').textContent = `$${(totalAfterBefore * (1 - ease)).toFixed(2)}`;

            plateCounters.forEach((c, i) => c.textContent = Math.max(0, Math.round(plateValues[i] * (1 - ease))));

            if (progress < 1) requestAnimationFrame(animate);
            else { dashboard.orderItems = []; dashboard.updateDisplay(); dashboard.addToOrder = originalAdd; }
        };

        requestAnimationFrame(animate);
    }

    createOrderItemElement(item, idx) {
        const article = document.createElement('article');
        article.className = idx % 2 === 0 ? 'frame-25' : 'frame-28';

        article.innerHTML = `
            <div class="text-wrapper-9">${item.quantity}x ${item.name}</div>
            <div class="frame-26">
                <div class="text-wrapper-10">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="frame-wrapper" type="button" aria-label="Remove order item">
                    <div class="frame-27">
                        <span class="text-wrapper-6">Remove</span>
                    </div>
                </button>
            </div>
        `;
        return article;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OrderDashboard();
});
