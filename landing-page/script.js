document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. หน้า product.html
  // ==========================================
  const productList = document.getElementById('product-list');
  const filterBar = document.getElementById('filter-bar');

  if (productList) {
    let allProducts = [];

    // อ่านค่า URL Parameter ?style=xxx
    const urlParams = new URLSearchParams(window.location.search);
    const initialStyle = urlParams.get('style') || 'all';

    // โหลดข้อมูลสินค้า
    fetch('products.json')
      .then(response => response.json())
      .then(data => {
        allProducts = data;
        renderProducts(initialStyle);
        updateActiveFilterButton(initialStyle);
      })
      .catch(error => console.error('Error loading products:', error));

    // ฟังก์ชันสำหรับแสดงผลการ์ดสินค้า
    function renderProducts(styleFilter) {
      productList.innerHTML = '';
      
      const filteredProducts = (styleFilter === 'all' || !styleFilter)
        ? allProducts
        : allProducts.filter(p => p.style.toLowerCase() === styleFilter.toLowerCase());

      if (filteredProducts.length === 0) {
        productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">ไม่พบรายการสินค้า</p>';
        return;
      }

      filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-image-wrap">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <span class="product-tag">${product.style}</span>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">฿${product.price}</span>
            <a href="order.html?item=${encodeURIComponent(product.name)}&price=${product.price}" class="btn">สั่งซื้อ</a>
          </div>
        `;
        productList.appendChild(card);
      });
    }

    // จัดการการกดปุ่มกรองสินค้า
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .filter-btn');
        if (btn) {
          const selectedStyle = btn.getAttribute('data-style');
          renderProducts(selectedStyle);
          updateActiveFilterButton(selectedStyle);

          // อัปเดต URL โดยไม่รีโหลดหน้า
          const newUrl = selectedStyle === 'all' 
            ? window.location.pathname 
            : `${window.location.pathname}?style=${selectedStyle}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      });
    }

    // อัปเดตสถานะปุ่ม Active
    function updateActiveFilterButton(activeStyle) {
      if (!filterBar) return;
      const buttons = filterBar.querySelectorAll('button, .filter-btn');
      buttons.forEach(btn => {
        if (btn.getAttribute('data-style') === activeStyle) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  // ==========================================
  // 2. หน้า order.html
  // ==========================================
  const orderForm = document.getElementById('orderForm');

  if (orderForm) {
    // อ่านค่า URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item') || '';
    const priceParam = urlParams.get('price') || '';

    const styleInput = document.getElementById('style');
    const totalInput = document.getElementById('total');

    if (styleInput && itemParam) styleInput.value = itemParam;
    if (totalInput && priceParam) totalInput.value = priceParam;

    // จัดการการส่งฟอร์มสั่งซื้อ
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const payload = {
        customerName: document.getElementById('customerName')?.value || '',
        contact: document.getElementById('contact')?.value || '',
        style: document.getElementById('style')?.value || '',
        total: document.getElementById('total')?.value || '',
        note: document.getElementById('note')?.value || ''
      };

      fetch('https://script.google.com/macros/s/AKfycbxCn73O_-1GnBnkpJ4Xvi5328bGx8IRfZHYt9BuAAXeJTunpPZSZGIODV5mh7UyMNyx/exec', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => { window.location.href = 'thankyou.html'; })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      });
    });
  }

  // ==========================================
  // 3. หน้า admin.html
  // ==========================================
  const ordersTableBody = document.querySelector('#ordersTable tbody');

  if (ordersTableBody) {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTx-NEVN2bb7xKpMBhYC84tLX1e3tInCdMuAU0U3wg9P_GlH-Sc5hqUzSvQbPCWR-439CUXO077PBl2/pub?gid=86591242&single=true&output=csv';

    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const rows = parseCSV(csvText);
        
        if (rows.length <= 1) {
          ordersTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">ไม่พบข้อมูลรายการสั่งซื้อ</td></tr>';
          return;
        }

        // แยก Header และเรียงข้อมูลล่าสุดขึ้นก่อน (Data Rows Reverse)
        const dataRows = rows.slice(1).reverse();

        ordersTableBody.innerHTML = '';
        dataRows.forEach(row => {
          if (row.length === 1 && row[0] === '') return; // ข้ามบรรทัดว่าง

          const tr = document.createElement('tr');
          row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
          });
          ordersTableBody.appendChild(tr);
        });
      })
      .catch(error => {
        console.error('Error fetching admin data:', error);
        ordersTableBody.innerHTML = '<tr><td colspan="100%" style="text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
      });

    // ฟังก์ชัน Custom CSV Parser
    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      return lines.map(line => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.replace(/^"|"$/g, '').trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.replace(/^"|"$/g, '').trim());
        return result;
      });
    }
  }

});