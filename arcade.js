// Hamburger menu - MUST be outside the cart IIFE
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function() {
      navLinks.classList.toggle("active");
      console.log("Toggled! Classes:", navLinks.classList);
    });
  }
});

// Cart functionality
(function () {
  const MAX_PER_ITEM_SIZE = 20;
  const cart = [];
  const cartSummary = document.getElementById("cart-summary");
  const cartCount = document.getElementById("cart-count");
  const cartModal = document.getElementById("cart-modal");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const clearCartBtn = document.getElementById("clear-cart");
  const closeCartBtn = document.getElementById("close-cart");
  const orderCartBtn = document.getElementById("order-cart");

  // Only run cart code if cart elements exist
  if (!cartSummary) return;

  function getSelectedExtrasInfo(menuItem) {
    const extrasCheckboxes = menuItem.querySelectorAll(
      ".extras-options input[type='checkbox']"
    );
    let extrasPrice = 0;
    let extrasIds = [];
    let extrasNames = [];

    extrasCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        extrasPrice += parseFloat(checkbox.dataset.price);
        extrasIds.push(checkbox.id);
        const labelElement = menuItem.querySelector(`label[for="${checkbox.id}"]`);
        if (labelElement) {
          extrasNames.push(labelElement.textContent.trim());
        }
      }
    });

    extrasIds.sort();
    const extrasKey = extrasIds.join(",");

    return { extrasPrice, extrasKey, extrasNames };
  }

  function updatePriceDisplay(menuItem) {
    const selectedInput = menuItem.querySelector(
      "input[type='radio']:checked"
    );
    const priceDisplay = menuItem.querySelector(".item-price");
    if (selectedInput && priceDisplay) {
      const basePrice = parseFloat(selectedInput.dataset.price);
      const { extrasPrice } = getSelectedExtrasInfo(menuItem);
      const totalPrice = basePrice + extrasPrice;
      priceDisplay.textContent = `₵${totalPrice.toFixed(2)}`;
    } else if (priceDisplay) {
      priceDisplay.textContent = "";
    }
  }

  function getQuantityInCart(name, size, extrasKey) {
    const item = cart.find(
      (i) => i.name === name && i.size === size && i.extrasKey === extrasKey
    );
    return item ? item.quantity : 0;
  }

  function updateStockAvailability() {
    document.querySelectorAll(".menu-item").forEach((menuItem) => {
      const name = menuItem.dataset.name;
      const sizeInputs = menuItem.querySelectorAll("input[type='radio']");
      const addToCartBtn = menuItem.querySelector(".add-to-cart");
      let anyAvailable = false;

      sizeInputs.forEach((input) => {
        const size = input.value;
        const maxStockAttr = input.getAttribute("data-maxstock");
        const maxStock = maxStockAttr
          ? parseInt(maxStockAttr)
          : MAX_PER_ITEM_SIZE;
        const { extrasKey } = getSelectedExtrasInfo(menuItem);
        const qtyInCart = getQuantityInCart(name, size, extrasKey);

        const label = menuItem.querySelector(`label[for="${input.id}"]`);

        if (qtyInCart >= maxStock) {
          input.disabled = true;
          if (label) label.classList.add("sold-out");
          if (input.checked) {
            input.checked = false;
            const availableInput = Array.from(sizeInputs).find(
              (si) => !si.disabled
            );
            if (availableInput) {
              availableInput.checked = true;
            }
            updatePriceDisplay(menuItem);
          }
        } else {
          input.disabled = false;
          if (label) label.classList.remove("sold-out");
          anyAvailable = true;
        }
      });

      if (addToCartBtn) {
        addToCartBtn.disabled = !anyAvailable;
      }
    });
  }

  function updateCartSummary() {
    const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.textContent = totalQty;
    cartSummary.setAttribute(
      "aria-label",
      `View cart. ${totalQty} item${totalQty !== 1 ? "s" : ""} in cart.`
    );
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function getMaxStock(itemName, size) {
    const menuItem = [...document.querySelectorAll(".menu-item")].find(
      (el) => el.dataset.name === itemName
    );
    if (!menuItem) return MAX_PER_ITEM_SIZE;

    const sizeInput = menuItem.querySelector(
      `input[type="radio"][value="${size}"]`
    );
    if (!sizeInput) return MAX_PER_ITEM_SIZE;

    const maxStockAttr = sizeInput.getAttribute("data-maxstock");
    return maxStockAttr ? parseInt(maxStockAttr) : MAX_PER_ITEM_SIZE;
  }

  function renderCartItems() {
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
      cartTotal.textContent = "Total: ₵0.00";
      return;
    }
    cart.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.setAttribute("role", "listitem");

      const nameSizeSpan = document.createElement("span");
      nameSizeSpan.className = "name-size";
      nameSizeSpan.textContent = `${item.name} (${item.size})`;
      div.appendChild(nameSizeSpan);

      if (item.extrasNames && item.extrasNames.length > 0) {
        const extrasSpan = document.createElement("span");
        extrasSpan.style.marginLeft = "6px";
        extrasSpan.style.fontWeight = "500";
        if (item.extrasNames.length === 1) {
          extrasSpan.textContent = item.extrasNames[0];
        } else {
          extrasSpan.textContent = "Extras";
        }
        div.appendChild(extrasSpan);
      }

      const qtyContainer = document.createElement("span");
      qtyContainer.className = "quantity";

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      minusBtn.style.marginRight = "5px";
      minusBtn.style.cursor = "pointer";
      minusBtn.addEventListener("click", () => {
        if (item.quantity > 1) {
          item.quantity--;
          updateCartSummary();
          renderCartItems();
          updateStockAvailability();
        } else {
          if (confirm("Remove this item from the cart?")) {
            cart.splice(index, 1);
            updateCartSummary();
            renderCartItems();
            updateStockAvailability();
          }
        }
      });
      qtyContainer.appendChild(minusBtn);

      const qtyDisplay = document.createElement("span");
      qtyDisplay.textContent = item.quantity;
      qtyDisplay.style.margin = "0 5px";
      qtyContainer.appendChild(qtyDisplay);

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.style.marginLeft = "5px";
      plusBtn.style.cursor = "pointer";
      plusBtn.addEventListener("click", () => {
        const maxStock = getMaxStock(item.name, item.size);
        if (item.quantity < maxStock) {
          item.quantity++;
          updateCartSummary();
          renderCartItems();
          updateStockAvailability();
        } else {
          alert(`Maximum quantity of ${maxStock} reached for this item.`);
        }
      });
      qtyContainer.appendChild(plusBtn);

      div.appendChild(qtyContainer);

      const priceSpan = document.createElement("span");
      priceSpan.className = "price";
      priceSpan.textContent = `₵${(item.price * item.quantity).toFixed(2)}`;
      div.appendChild(priceSpan);

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.style.marginLeft = "10px";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.backgroundColor = "#e5533d";
      removeBtn.style.color = "white";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "4px";
      removeBtn.style.padding = "2px 8px";
      removeBtn.addEventListener("click", () => {
        cart.splice(index, 1);
        updateCartSummary();
        renderCartItems();
        updateStockAvailability();
      });
      div.appendChild(removeBtn);

      cartItemsContainer.appendChild(div);
    });
    cartTotal.textContent = `Total: ₵${calculateTotal().toFixed(2)}`;
  }

  function showCart() {
    renderCartItems();
    cartModal.classList.add("active");
    closeCartBtn.focus();
  }

  function hideCart() {
    cartModal.classList.remove("active");
    cartSummary.focus();
  }

  function addToCart(name, size, price, extrasPrice, extrasKey, extrasNames, maxStock) {
    const existingItem = cart.find(
      (i) =>
        i.name === name &&
        i.size === size &&
        i.extrasKey === extrasKey
    );
    if (existingItem) {
      if (existingItem.quantity >= maxStock) {
        alert(
          `Sorry, maximum quantity (${maxStock}) reached for ${name} (${size}) with selected extras.`
        );
        return false;
      }
      existingItem.quantity++;
    } else {
      cart.push({
        name,
        size,
        price,
        extrasPrice,
        extrasKey,
        extrasNames,
        quantity: 1,
      });
    }
    updateStockAvailability();
    updateCartSummary();
    return true;
  }

  function clearCart() {
    cart.length = 0;
    updateCartSummary();
    renderCartItems();
    updateStockAvailability();
  }

  function orderCart() {
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }

    const phoneNumber = document.getElementById("phone-number").value.trim();
    if (!phoneNumber) {
      alert("Please enter your phone number.");
      return;
    }
    const recipient = "agyeman.nana936@gmail.com"; 
    const subject = encodeURIComponent("New Order from Arcade");
    let body = "Hello,%0D%0A%0D%0AI would like to place an order for the following items:%0D%0A%0D%0A";

    cart.forEach((item, index) => {
      body += `${index + 1}. ${item.name} (${item.size})`;
      if (item.extrasNames && item.extrasNames.length > 0) {
        if (item.extrasNames.length === 1) {
          body += ` with ${item.extrasNames[0]}`;
        } else {
          body += " with extras";
        }
      }
      body += ` x${item.quantity} - ₵${(item.price * item.quantity).toFixed(2)}%0D%0A`;
    });

    body += `%0D%0ATotal: ₵${calculateTotal().toFixed(2)}%0D%0A%0D%0A`;
    body += `Phone Number: ${phoneNumber}%0D%0A%0D%0APlease contact me to confirm the order.%0D%0A%0D%0AThank you!`;

    const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  }

  document.querySelectorAll(".menu-item").forEach((item) => {
    const sizeInputs = item.querySelectorAll("input[type='radio']");
    const extrasCheckboxes = item.querySelectorAll(
      ".extras-options input[type='checkbox']"
    );
    const addToCartBtn = item.querySelector(".add-to-cart");
    const name = item.dataset.name;

    sizeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        updatePriceDisplay(item);
      });
    });

    extrasCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        updatePriceDisplay(item);
      });
    });

    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => {
        const selectedSizeInput = item.querySelector(
          "input[type='radio']:checked"
        );
        if (!selectedSizeInput) {
          alert("Please select a size before adding to cart.");
          return;
        }
        const size = selectedSizeInput.value;
        const basePrice = parseFloat(selectedSizeInput.dataset.price);
        const maxStockAttr = selectedSizeInput.getAttribute("data-maxstock");
        const maxStock = maxStockAttr ? parseInt(maxStockAttr) : MAX_PER_ITEM_SIZE;
        const { extrasPrice, extrasKey, extrasNames } = getSelectedExtrasInfo(item);
        const totalItemPrice = basePrice + extrasPrice;
        if (
          addToCart(name, size, totalItemPrice, extrasPrice, extrasKey, extrasNames, maxStock)
        ) {
          alert(`Added ${name} (${size}) with extras to cart!`);
        }
      });
    }
  });

  if (cartSummary) {
    cartSummary.addEventListener("click", showCart);
    cartSummary.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showCart();
      }
    });
  }

  if (closeCartBtn) closeCartBtn.addEventListener("click", hideCart);
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear the cart?")) {
        clearCart();
      }
    });
  }
  if (orderCartBtn) orderCartBtn.addEventListener("click", orderCart);

  if (cartModal) {
    cartModal.addEventListener("click", (e) => {
      if (e.target === cartModal) {
        hideCart();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cartModal && cartModal.classList.contains("active")) {
      hideCart();
    }
  });

  updateStockAvailability();
  updateCartSummary();
})();

// Smooth scroll for view buttons
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const href = this.getAttribute('onclick');
      if (href && href.includes('#')) {
        const match = href.match(/#[^']+/);
        if (match) {
          const target = document.querySelector(match[0]);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });
  });
});