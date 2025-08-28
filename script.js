class OrderDashboard {
    constructor() {
        this.orderItems = [];

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

            increaseBtn.addEventListener('click', () => {
                this.updateQuantity(index, 1);
            });

            decreaseBtn.addEventListener('click', () => {
                this.updateQuantity(index, -1);
            });
        });

        // Bind product selection (clicking on product images/prices)
        const products = document.querySelectorAll('.frame-11');
        products.forEach((product, index) => {
            const productImage = product.querySelector('.frame-12, .frame-18, .frame-19, .image-wrapper');
            const priceElement = product.querySelector('.text-wrapper-5');

            if (productImage && priceElement) {
                productImage.addEventListener('click', () => {
                    this.addToOrder(index);
                });

                priceElement.addEventListener('click', () => {
                    this.addToOrder(index);
                });
            }
        });

        // Bind edit buttons in order history
        document.addEventListener('click', (e) => {
            if (e.target.closest('.frame-27')) {
                const orderItem = e.target.closest('article');
                const index = Array.from(orderItem.parentElement.children).indexOf(orderItem) - 1; // -1 for header
                if (index >= 0) {
                    this.removeFromOrder(index);
                }
            }
        });
    }

    bindPopupEvents() {
        const viewButton = document.querySelector('.frame-5');
        const popup = document.querySelector('.cost-popup');
        const closeBtn = popup.querySelector('.close-popup');

        viewButton.addEventListener('click', () => {
            // Update breakdown before showing
            this.updateDisplay();
            popup.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            popup.style.display = 'none';
        });
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
        const product = this.getProductInfo(productIndex);
        const quantityControls = document.querySelectorAll('.frame-14');
        let quantity = parseInt(quantityControls[productIndex].querySelector('.frame-16 .text-wrapper-6').textContent);

        // If quantity is 0, add 1 item when clicking the plate
        if (quantity === 0) {
            quantity = 1;
        }

        // Check if item already exists in order
        const existingItemIndex = this.orderItems.findIndex(item => item.name === product.name);

        if (existingItemIndex >= 0) {
            // Update existing item
            this.orderItems[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            this.orderItems.push({
                name: product.name,
                price: product.price,
                quantity: quantity
            });
        }

        // Reset quantity display
        quantityControls[productIndex].querySelector('.frame-16 .text-wrapper-6').textContent = '0';

        this.updateDisplay();
    }

    removeFromOrder(index) {
        if (index >= 0 && index < this.orderItems.length) {
            // Decrease quantity by 1
            this.orderItems[index].quantity -= 1;

            // If quantity reaches 0, remove the item completely
            if (this.orderItems[index].quantity <= 0) {
                this.orderItems.splice(index, 1);
            }

            this.updateDisplay();
        }
    }


    // ===== CALCULATIONS =====
    calculateTotalBeforeTax() {
        return this.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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

    // ===== DISPLAY UPDATES =====
    updateDisplay() {
        const beforeTaxElement = document.querySelector('.before-tax');
        const serviceElement = document.querySelector('.service-charge');
        const gstElement = document.querySelector('.gst');
        const totalElement = document.querySelector('.text-wrapper-3'); // main total element

        const beforeTax = this.calculateTotalBeforeTax();
        const serviceCharge = this.calculateServiceCharge();
        const gst = this.calculateGST();
        const afterTax = this.calculateTotalAfterTax();

        if (beforeTaxElement) beforeTaxElement.textContent = `$${beforeTax.toFixed(2)}`;
        if (serviceElement) serviceElement.textContent = `$${serviceCharge.toFixed(2)}`;
        if (gstElement) gstElement.textContent = `$${gst.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${afterTax.toFixed(2)}`;

        this.updateOrderHistory();
    }

    updateOrderHistory() {
        const orderHistoryContainer = document.querySelector('.frame-23');
        const header = orderHistoryContainer.querySelector('.frame-24');

        // Clear existing order items (keep header)
        const existingItems = orderHistoryContainer.querySelectorAll('article');
        existingItems.forEach(item => item.remove());

        // Add new order items
        this.orderItems.forEach((item, index) => {
            const orderItemElement = this.createOrderItemElement(item, index);
            orderHistoryContainer.appendChild(orderItemElement);
        });

        // Show/hide "View All" button based on whether there are items
        const viewAllButton = header.querySelector('.text-wrapper-8');
        viewAllButton.style.display = this.orderItems.length > 0 ? 'block' : 'none';
    }

    createOrderItemElement(item, index) {
        const article = document.createElement('article');
        article.className = index % 2 === 0 ? 'frame-25' : 'frame-28';

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

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OrderDashboard();
});
