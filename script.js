// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  // Save preference to localStorage
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme preference on page load
(function() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
})();

// State
let files = { a: null, b: null, c: null };
let fileNames = { a: '', b: '', c: '' };
let tableData = [];
let sortState = {};
let hasFileC = false;

function handleFileSelect(input, key) {
  const file = input.files[0];
  const group = document.getElementById(`group-${key}`);
  const nameEl = document.getElementById(`name-${key}`);
  
  if (file) {
    files[key] = file;
    fileNames[key] = file.name;
    nameEl.textContent = file.name;
    group.classList.add('has-file');
  } else {
    files[key] = null;
    fileNames[key] = '';
    nameEl.textContent = 'No file selected';
    group.classList.remove('has-file');
  }
  
  updateCompareButton();
}

function updateCompareButton() {
  const btn = document.getElementById('btn-compare');
  btn.disabled = !(files.a && files.b);
  
  // Show "Add File C" button only when both A and B are selected and C is not visible
  const addFileCContainer = document.getElementById('add-file-c-container');
  const groupC = document.getElementById('group-c');
  if (files.a && files.b && groupC.style.display === 'none') {
    addFileCContainer.style.display = 'block';
  } else if (!files.a || !files.b) {
    addFileCContainer.style.display = 'none';
  }
}

function showFileC() {
  document.getElementById('group-c').style.display = 'block';
  document.getElementById('add-file-c-container').style.display = 'none';
}

function removeFileC() {
  // Clear the file input
  const fileInput = document.getElementById('file-c');
  fileInput.value = '';
  files.c = null;
  fileNames.c = '';
  document.getElementById('name-c').textContent = 'No file selected';
  document.getElementById('group-c').classList.remove('has-file');
  
  // Hide File C and show the add button again
  document.getElementById('group-c').style.display = 'none';
  document.getElementById('add-file-c-container').style.display = 'block';
}

function showError(message) {
  const el = document.getElementById('error-msg');
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch (err) {
        reject(new Error(`Invalid JSON in ${file.name}`));
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

function extractPrivileges(data) {
  // Match Python logic: extract from d[0]["privileges"]
  const result = {};
  try {
    const privileges = data[0].privileges;
    for (const p of privileges) {
      // Normalize whitespace to collapse duplicate entries with varying spaces
      const desc = (p.description || '').replace(/\s+/g, ' ').trim();
      const cat = (p.categories[0] || '').replace(/\s+/g, ' ').trim();
      // Use .get("enabled") equivalent - returns undefined if missing
      result[`${desc}|||${cat}`] = p.hasOwnProperty('enabled') ? p.enabled : undefined;
    }
  } catch (err) {
    console.error('Error extracting privileges:', err);
  }
  return result;
}

function icon(value) {
  if (value === true) return { symbol: '✓', cssClass: 'val-true' };
  if (value === false) return { symbol: '✗', cssClass: 'val-false' };
  return { symbol: '⌀', cssClass: 'val-missing' };
}

async function compareFiles() {
  const errorEl = document.getElementById('error-msg');
  errorEl.style.display = 'none';
  
  try {
    const [dataA, dataB] = await Promise.all([
      readFile(files.a),
      readFile(files.b)
    ]);
    
    let dataC = null;
    hasFileC = !!(files.c);
    if (hasFileC) {
      dataC = await readFile(files.c);
    }
    
    const A = extractPrivileges(dataA);
    const B = extractPrivileges(dataB);
    const C = hasFileC ? extractPrivileges(dataC) : {};
    
    // Get all unique keys
    const allKeys = new Set([...Object.keys(A), ...Object.keys(B), ...Object.keys(C)]);
    
    tableData = [];
    let matched = 0, mismatched = 0;
    
    for (const key of allKeys) {
      const [desc, cat] = key.split('|||');
      const valA = A[key];
      const valB = B[key];
      const valC = hasFileC ? C[key] : undefined;
      
      // Match Python logic: compare raw values without string conversion
      // Python: is_match = len(set(vals)) == 1
      const vals = hasFileC ? [valA, valB, valC] : [valA, valB];
      const uniqueVals = new Set(vals);
      const isMatch = uniqueVals.size === 1;
      
      if (isMatch) matched++;
      else mismatched++;
      
      const iconA = icon(valA);
      const iconB = icon(valB);
      const iconC = icon(valC);
      
      tableData.push({
        cat,
        desc,
        a: iconA.symbol,
        aClass: iconA.cssClass,
        b: iconB.symbol,
        bClass: iconB.cssClass,
        c: iconC.symbol,
        cClass: iconC.cssClass,
        status: isMatch ? 'Match' : 'Mismatch',
        statusClass: isMatch ? 'status-match' : 'status-mismatch'
      });
    }
    
    // Sort by category, then by description (to match Python behavior)
    tableData.sort((a, b) => {
      const catCompare = a.cat.localeCompare(b.cat);
      if (catCompare !== 0) return catCompare;
      return a.desc.localeCompare(b.desc);
    });
    
    // Update UI
    document.getElementById('stat-match').textContent = matched;
    document.getElementById('stat-mismatch').textContent = mismatched;
    
    // Update file name headers with title for hover tooltip
    const thA = document.getElementById('th-a');
    const thB = document.getElementById('th-b');
    const thC = document.getElementById('th-c');
    thA.textContent = fileNames.a;
    thA.title = fileNames.a;
    thB.textContent = fileNames.b;
    thB.title = fileNames.b;
    thC.textContent = fileNames.c;
    thC.title = fileNames.c;
    thC.style.display = hasFileC ? '' : 'none';
    
    renderTable();
    
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    
  } catch (err) {
    showError(err.message);
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const searchText = document.getElementById('search').value.toLowerCase();
  const showMatch = document.getElementById('filter-match').checked;
  const showMismatch = document.getElementById('filter-mismatch').checked;
  
  let html = '';
  let visibleCount = 0;
  
  for (const row of tableData) {
    // Filter by status
    if (row.status === 'Match' && !showMatch) continue;
    if (row.status === 'Mismatch' && !showMismatch) continue;
    
    // Filter by search text
    const rowText = `${row.cat} ${row.desc}`.toLowerCase();
    if (searchText && !rowText.includes(searchText)) continue;
    
    visibleCount++;
    html += `
      <tr data-status="${row.status}">
        <td>${escapeHtml(row.cat)}</td>
        <td>${escapeHtml(row.desc)}</td>
        <td class="file-col ${row.aClass}">${row.a}</td>
        <td class="file-col ${row.bClass}">${row.b}</td>
        ${hasFileC ? `<td class="file-col ${row.cClass}">${row.c}</td>` : ''}
        <td class="${row.statusClass}">${row.status}</td>
      </tr>
    `;
  }
  
  if (visibleCount === 0) {
    html = `<tr><td colspan="${hasFileC ? 6 : 5}" class="no-results">No results found</td></tr>`;
  }
  
  tbody.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function applyFilters() {
  renderTable();
}

function sortTable(colIndex) {
  const key = colIndex;
  sortState[key] = !sortState[key];
  const ascending = sortState[key];
  
  const getVal = (row) => {
    switch(colIndex) {
      case 0: return row.cat;
      case 1: return row.desc;
      case 5: return row.status;
      default: return '';
    }
  };
  
  tableData.sort((a, b) => {
    const av = getVal(a);
    const bv = getVal(b);
    return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  
  // Update header styling
  document.querySelectorAll('th').forEach((th, i) => {
    th.classList.remove('active');
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.remove();
  });
  
  const headers = document.querySelectorAll('th');
  const targetHeader = headers[colIndex];
  targetHeader.classList.add('active');
  
  const arrow = document.createElement('span');
  arrow.className = 'sort-arrow';
  arrow.textContent = ascending ? ' ▲' : ' ▼';
  targetHeader.appendChild(arrow);
  
  renderTable();
}

function normalize(val) {
  if (val.includes('✓')) return 'Enabled';
  if (val.includes('✗')) return 'Disabled';
  if (val.includes('⌀')) return 'Missing';
  return val;
}

function downloadCSV() {
  const searchText = document.getElementById('search').value.toLowerCase();
  const showMatch = document.getElementById('filter-match').checked;
  const showMismatch = document.getElementById('filter-mismatch').checked;
  
  const headers = hasFileC 
    ? ['Category', 'Description', fileNames.a, fileNames.b, fileNames.c, 'Status']
    : ['Category', 'Description', fileNames.a, fileNames.b, 'Status'];
  
  const rows = [headers];
  
  for (const row of tableData) {
    if (row.status === 'Match' && !showMatch) continue;
    if (row.status === 'Mismatch' && !showMismatch) continue;
    
    const rowText = `${row.cat} ${row.desc}`.toLowerCase();
    if (searchText && !rowText.includes(searchText)) continue;
    
    const csvRow = hasFileC
      ? [row.cat, row.desc, normalize(row.a), normalize(row.b), normalize(row.c), row.status]
      : [row.cat, row.desc, normalize(row.a), normalize(row.b), row.status];
    
    rows.push(csvRow);
  }
  
  const csv = rows
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'permissions_compare.csv';
  a.click();
  URL.revokeObjectURL(url);
}
