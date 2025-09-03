class OrderDashboard {
    constructor() {
        this.orderItems = [];
        this.isAnimatingRemoveAll = false; // prevent adding during animation

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
        // Bind quantity control buttons
        const quantityControls = document.querySelectorAll('.frame-14');
        quantityControls.forEach((control, index) => {
            const increaseBtn = control.querySelector('.frame-15').parentElement;
            const decreaseBtn = control.querySelector('.frame-17').parentElement;

            increaseBtn.addEventListener('click', () => this.updateQuantity(index, 1));
            decreaseBtn.addEventListener('click', () => this.updateQuantity(index, -1));
        });

        // Bind product selection
        const products = document.querySelectorAll('.frame-11');
        products.forEach((product, index) => {
            const productImage = product.querySelector('.frame-12, .frame-18, .frame-19, .image-wrapper');
            const priceElement = product.querySelector('.text-wrapper-5');

            if (productImage && priceElement) {
                productImage.addEventListener('click', () => this.addToOrder(index));
                priceElement.addEventListener('click', () => this.addToOrder(index));
            }
        });

        // Bind edit/remove buttons in order history
        document.addEventListener('click', (e) => {
            if (e.target.closest('.frame-27')) {
                const orderItem = e.target.closest('article');
                if (orderItem) {
                    const index = Array.from(orderItem.parentElement.children).indexOf(orderItem) - 1;
                    if (index >= 0) this.removeFromOrder(index);
                }
            }
        });

        // Bind custom amount input enter key
        const customAmountInput = document.getElementById('custom-amount');
        if (customAmountInput) {
            customAmountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // prevent form reload
                    this.submitCustomAmount();
                }
            });
        }

        // Bind custom amount button
        const addCustomButton = document.getElementById('add-custom-btn');
        if (addCustomButton) {
            addCustomButton.addEventListener('click', (e) => {
                e.preventDefault(); // prevent form reload
                this.submitCustomAmount();
            });
        }
    }

    bindPopupEvents() {
        const viewButton = document.querySelector('.frame-5');
        const popup = document.querySelector('.cost-popup');
        const closeBtn = popup.querySelector('.close-popup');

        viewButton.addEventListener('click', () => {
            this.updateDisplay();
            this.showPopup();
        });

        closeBtn.addEventListener('click', () => this.hidePopup());

        popup.addEventListener('click', (e) => {
            if (e.target === popup) this.hidePopup();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.classList.contains('show')) {
                this.hidePopup();
            }
        });
    }

    showPopup() {
        const popup = document.querySelector('.cost-popup');
        popup.style.display = 'flex';
        popup.offsetHeight; // force reflow
        popup.classList.add('show');
    }

    hidePopup() {
        const popup = document.querySelector('.cost-popup');
        popup.classList.remove('show');
        setTimeout(() => (popup.style.display = 'none'), 300);
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

    updateQuantity(productIndex, change) {
        const quantityControls = document.querySelectorAll('.frame-14');
        const quantityDisplay = quantityControls[productIndex].querySelector('.frame-16 .text-wrapper-6');
        let currentQuantity = parseInt(quantityDisplay.textContent);
        currentQuantity = Math.max(0, currentQuantity + change);
        quantityDisplay.textContent = currentQuantity;
    }

    addToOrder(productIndex) {
        if (this.isAnimatingRemoveAll) return;

        const product = this.getProductInfo(productIndex);
        const quantityControls = document.querySelectorAll('.frame-14');
        let quantity = parseInt(quantityControls[productIndex].querySelector('.frame-16 .text-wrapper-6').textContent);

        if (quantity === 0) quantity = 1;

        const existingItemIndex = this.orderItems.findIndex(item => item.name === product.name);
        if (existingItemIndex >= 0) {
            this.orderItems[existingItemIndex].quantity += quantity;
        } else {
            this.orderItems.push({ name: product.name, price: product.price, quantity });
        }

        quantityControls[productIndex].querySelector('.frame-16 .text-wrapper-6').textContent = '0';
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
        if (this.isAnimatingRemoveAll) return;

        const customAmountInput = document.getElementById('custom-amount');
        if (!customAmountInput) return;

        let inputValue = customAmountInput.value.trim();
        if (inputValue.startsWith('$')) inputValue = inputValue.substring(1);

        const amount = parseFloat(inputValue);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than $0.00');
            return;
        }

        const existingCustomIndex = this.orderItems.findIndex(item =>
            item.name === 'Custom Amount' && item.price === amount
        );

        if (existingCustomIndex >= 0) {
            this.orderItems[existingCustomIndex].quantity += 1;
        } else {
            this.orderItems.push({ name: 'Custom Amount', price: amount, quantity: 1 });
        }

        customAmountInput.value = '';
        this.updateDisplay();
    }

    // ===== CALCULATIONS =====
    calculateTotalBeforeTax() {
        return this.orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }
    calculateServiceCharge() {
        return this.calculateTotalBeforeTax() * this.serviceChargeRate;
    }
    calculateGST() {
        return (this.calculateTotalBeforeTax() + this.calculateServiceCharge()) * this.gstRate;
    }
    calculateTotalAfterTax() {
        return this.calculateTotalBeforeTax() + this.calculateServiceCharge() + this.calculateGST();
    }

    // ===== DISPLAY =====
    updateDisplay() {
        const beforeTax = this.calculateTotalBeforeTax();
        const serviceCharge = this.calculateServiceCharge();
        const gst = this.calculateGST();
        const afterTax = this.calculateTotalAfterTax();

        document.querySelectorAll('.before-tax').forEach(el => (el.textContent = `$${beforeTax.toFixed(2)}`));
        document.querySelectorAll('.service-charge').forEach(el => (el.textContent = `$${serviceCharge.toFixed(2)}`));
        document.querySelectorAll('.gst').forEach(el => (el.textContent = `$${gst.toFixed(2)}`));
        document.querySelectorAll('.text-wrapper-3, .after-tax').forEach(el => (el.textContent = `$${afterTax.toFixed(2)}`));

        this.updateOrderHistory();
    }

    updateOrderHistory() {
        const orderHistoryContainer = document.querySelector('.frame-23');
        const header = orderHistoryContainer.querySelector('.frame-24');

        const existingItems = orderHistoryContainer.querySelectorAll('article, .empty-state');
        existingItems.forEach(item => item.remove());

        if (this.orderItems.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No items yet';
            orderHistoryContainer.appendChild(emptyState);
        } else {
            this.orderItems.forEach((item, index) => {
                const orderItemElement = this.createOrderItemElement(item, index);
                orderHistoryContainer.appendChild(orderItemElement);
            });
        }

        const removeAllButton = header.querySelector('.text-wrapper-8');
        removeAllButton.textContent = "Remove All";
        removeAllButton.style.display = this.orderItems.length > 0 ? 'block' : 'none';
        removeAllButton.classList.remove('remove-all-removing');

        // Open popup
        removeAllButton.onclick = () => {
            document.getElementById('removeAllPopup').classList.add('show');
        };

        // Cancel button handler
        document.getElementById('cancelRemoveAll').onclick = () => {
            document.getElementById('removeAllPopup').classList.remove('show');
        };

        // Confirm button handler
        document.getElementById('confirmRemoveAll').onclick = () => {
            const items = [...orderHistoryContainer.querySelectorAll('article')];
            const removeAllButton = header.querySelector('.text-wrapper-8');

            document.getElementById('removeAllPopup').classList.remove('show');
            this.isAnimatingRemoveAll = true;

            items.forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
                item.classList.add('order-removing');
            });
            removeAllButton.classList.add('remove-all-removing');

            const totalBefore = this.calculateTotalBeforeTax();
            const serviceChargeBefore = this.calculateServiceCharge();
            const gstBefore = this.calculateGST();
            const totalAfterBefore = this.calculateTotalAfterTax();

            const stagger = 100;
            const animationLength = 400;
            const totalDuration = items.length * stagger + animationLength;

            const frameRate = 60;
            const totalFrames = Math.round((totalDuration / 1000) * frameRate);
            let frame = 0;

            const animateTotals = () => {
                frame++;
                const progress = 1 - frame / totalFrames;
                document.querySelectorAll('.before-tax').forEach(el => (el.textContent = `$${(totalBefore * progress).toFixed(2)}`));
                document.querySelectorAll('.service-charge').forEach(el => (el.textContent = `$${(serviceChargeBefore * progress).toFixed(2)}`));
                document.querySelectorAll('.gst').forEach(el => (el.textContent = `$${(gstBefore * progress).toFixed(2)}`));
                document.querySelectorAll('.text-wrapper-3, .after-tax').forEach(el => (el.textContent = `$${(totalAfterBefore * progress).toFixed(2)}`));
                if (frame < totalFrames) requestAnimationFrame(animateTotals);
            };
            animateTotals();

            setTimeout(() => {
                this.orderItems = [];
                this.isAnimatingRemoveAll = false;
                this.updateDisplay();
            }, totalDuration);
        };
    }

    createOrderItemElement(item, index) {
        const article = document.createElement('article');
        article.className = index % 2 === 0 ? 'frame-25' : 'frame-28';
        article.innerHTML = `
            <div class="text-wrapper-9">${item.quantity}x ${item.name}</div>
            <div class="frame-26">
                <div class="text-wrapper-10">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="frame-wrapper" type="button" aria-label="Remove order item">
                    <div class="frame-27"><span class="text-wrapper-6">Remove</span></div>
                </button>
            </div>`;
        return article;
    }
}

document.addEventListener('DOMContentLoaded', () => new OrderDashboard());
