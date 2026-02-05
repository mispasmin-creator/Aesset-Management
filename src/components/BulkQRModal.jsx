import React, { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';


import { 
    X, Download, FileText, RefreshCw, Loader, AlertCircle,
    Package, Printer, Settings, Globe, Building, User
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import company logo
import CompanyLogo from '../assets/logo.png';

// Product QR Card Component with Logo
const ProductQRCard = ({ product, baseUrl, showLogo = true }) => {
    if (!product || !product.sn) return null;
    
    const productUrl = `${baseUrl}/#/product/${product.sn}`;
    
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-all duration-300 hover:border-light-blue-300 group">
            {/* QR Code with Logo Overlay */}
            <div className="relative inline-block">
                <QRCodeSVG
                    value={productUrl}
                    size={140}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                />
                {showLogo && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-md border border-light-blue-300 flex items-center justify-center shadow-sm">
                        <img 
                            src={CompanyLogo} 
                            alt="Company Logo" 
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                                console.error('Failed to load logo image');
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full bg-gradient-to-br from-light-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">C</span>
                                    </div>
                                `;
                            }}
                        />
                    </div>
                )}
            </div>
            
            {/* Product Info */}
            <div className="mt-3 space-y-1">
                <div className="flex items-center justify-center gap-2">
                    <Package size={12} className="text-light-blue-600" />
                    <p className="font-bold text-light-blue-800 text-sm truncate">
                        {product.sn || 'N/A'}
                    </p>
                </div>
                <p className="text-slate-700 text-xs truncate font-medium px-2">
                    {product.productName || 'Unnamed Product'}
                </p>
                {product.brand && product.model && (
                    <p className="text-slate-500 text-[11px] truncate">
                        {product.brand} • {product.model}
                    </p>
                )}
                {product.category && (
                    <p className="text-slate-400 text-[10px] truncate">
                        {product.category}
                    </p>
                )}
                {product.location && (
                    <p className="text-slate-400 text-[10px] truncate flex items-center justify-center gap-1">
                        <Building size={10} />
                        {product.location}
                    </p>
                )}
            </div>
            
            {/* URL Info */}
            <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                    <Globe size={10} className="text-slate-500" />
                    <span className="text-[10px] font-semibold text-slate-600">Scan URL:</span>
                </div>
                <code className="text-[9px] text-light-blue-600 break-all block leading-tight font-mono">
                    {productUrl}
                </code>
            </div>
        </div>
    );
};

const BulkQRModal = ({ isOpen, onClose, products: initialProducts }) => {
    const qrContainerRef = useRef(null);
    const [products, setProducts] = useState(initialProducts || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const baseUrl = window.location.origin;
    
    // Fetch products from Google Sheets if not provided
    useEffect(() => {
        if (isOpen) {
            fetchProductsFromGoogleSheets();
        }
    }, [isOpen]);

    const fetchProductsFromGoogleSheets = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if we have products in context/localStorage first
            const storedProducts = localStorage.getItem('products');
            if (storedProducts) {
                const parsedProducts = JSON.parse(storedProducts);
                setProducts(parsedProducts);
                
                // Initialize selection
                setSelectedProducts(parsedProducts.map(p => p.sn).filter(sn => sn));
            }
            
            // Try to fetch fresh data from Google Sheets
            try {
                const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec";
                
                const response = await fetch(`${APP_SCRIPT_URL}?sheet=Products&timestamp=${Date.now()}`);
                const result = await response.json();
                
                if (result.success && result.data) {
                    const sheetData = result.data;
                    const headers = sheetData[0];
                    const rows = sheetData.slice(1);
                    
                    // Map headers to product properties based on your sheet structure
                    const productList = rows.map((row, index) => {
                        return {
                            id: index + 1,
                            sn: row[1] || `SN-${String(index + 1).padStart(4, '0')}`, // Serial No
                            productName: row[2] || 'Unnamed Product', // Product Name
                            category: row[3] || '', // Category
                            type: row[4] || '', // Type
                            brand: row[5] || '', // Brand
                            model: row[6] || '', // Model
                            sku: row[7] || '', // SKU
                            location: row[17] || '', // Location
                            department: row[18] || '', // Department
                            status: row[10] || 'Active', // Status
                            cost: row[13] || 0, // Cost
                            assetValue: row[35] || 0, // Asset Value
                            warranty: row[21] || 'No', // Warranty
                            amc: row[22] || 'No', // AMC
                            maintenance: row[23] || 'No', // Maintenance
                            priority: row[24] || 'Normal', // Priority
                        };
                    }).filter(product => product.sn && product.sn !== 'N/A');
                    
                    setProducts(productList);
                    
                    // Initialize selection with all valid products
                    setSelectedProducts(productList.map(p => p.sn).filter(sn => sn));
                    
                    // Store in localStorage for offline use
                    localStorage.setItem('products', JSON.stringify(productList));
                }
            } catch (fetchError) {
                console.log('Using cached products, fetch failed:', fetchError.message);
                // Continue with stored products if fetch fails
            }
            
        } catch (err) {
            console.error('Error processing products:', err);
            setError('Failed to load products. Using cached data if available.');
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search
    const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            (product.sn && product.sn.toLowerCase().includes(searchLower)) ||
            (product.productName && product.productName.toLowerCase().includes(searchLower)) ||
            (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
            (product.model && product.model.toLowerCase().includes(searchLower)) ||
            (product.category && product.category.toLowerCase().includes(searchLower)) ||
            (product.location && product.location.toLowerCase().includes(searchLower))
        );
    });

    // Toggle product selection
    const toggleProductSelection = (sn) => {
        setSelectedProducts(prev => {
            if (prev.includes(sn)) {
                return prev.filter(s => s !== sn);
            } else {
                return [...prev, sn];
            }
        });
    };

    // Select all/deselect all
    const toggleSelectAll = () => {
        const allSns = filteredProducts.map(p => p.sn).filter(sn => sn);
        if (selectedProducts.length === allSns.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(allSns);
        }
    };

    // Get selected product objects
    const selectedProductObjects = filteredProducts.filter(p => 
        selectedProducts.includes(p.sn)
    );

    // Enhanced PDF generation with company logo
  // BETTER SOLUTION: Use the QRCodeSVG component properly
const generatePDF = async () => {
  if (selectedProductObjects.length === 0) {
    alert('Please select at least one product');
    return;
  }

  setGeneratingPDF(true);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;

    const qrSize = 38; // mm
    const colGap = 10;
    const rowGap = 18;
    const cols = 4;

    let x = margin;
    let y = margin + 10;
    let col = 0;

    // 🔹 Load logo once
    const logoImg = new Image();
    logoImg.src = CompanyLogo;
    await new Promise((res) => (logoImg.onload = res));

    for (let i = 0; i < selectedProductObjects.length; i++) {
      const product = selectedProductObjects[i];
      const productUrl = `${baseUrl}/#/product/${product.sn}`;

      // 1️⃣ Create canvas
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // 2️⃣ Generate QR
     await QRCode.toCanvas(canvas, productUrl, {
  width: size,
  margin: 4, // IMPORTANT: quiet zone
  errorCorrectionLevel: 'H',
  color: {
    dark: '#0f172a',
    light: '#ffffff',
  },
});

         const logoSize = size * 0.16; // ✅ 16% ONLY
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

     ctx.fillStyle = '#ffffff';
ctx.fillRect(
  logoX - 14,
  logoY - 14,
  logoSize + 28,
  logoSize + 28
);
      // 4️⃣ Draw logo
ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      // 5️⃣ Convert to image
      const qrImage = canvas.toDataURL('image/png');

      // 6️⃣ Page break
      if (y + qrSize > pageHeight - margin) {
        pdf.addPage();
        x = margin;
        y = margin;
        col = 0;
      }

      // 7️⃣ Add QR to PDF
      pdf.addImage(qrImage, 'PNG', x, y, qrSize, qrSize);

      // 8️⃣ Labels
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(product.sn, x + qrSize / 2, y + qrSize + 4, { align: 'center' });

      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        product.productName?.substring(0, 20) || '',
        x + qrSize / 2,
        y + qrSize + 8,
        { align: 'center' }
      );

      // 9️⃣ Grid layout
      col++;
      if (col >= cols) {
        col = 0;
        x = margin;
        y += qrSize + rowGap;
      } else {
        x += qrSize + colGap;
      }
    }

    pdf.save(`asset-qrcodes-${Date.now()}.pdf`);
  } catch (err) {
    console.error('QR PDF error:', err);
    alert('Failed to generate QR PDF');
  } finally {
    setGeneratingPDF(false);
  }
};



    const refreshProducts = () => {
        fetchProductsFromGoogleSheets();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-light-blue-600 to-light-blue-700 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Printer size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Bulk QR Code Generator</h2>
                            <p className="text-white/80 text-sm">
                                {loading ? 'Loading...' : `${selectedProductObjects.length}/${filteredProducts.length} products selected`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={refreshProducts}
                            disabled={loading}
                            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh products"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products by SN, name, brand, location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent transition-all"
                                />
                                <Settings size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>

                        {/* Selection Controls */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleSelectAll}
                                className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                            >
                                {selectedProducts.length === filteredProducts.length ? 
                                    'Deselect All' : 'Select All'}
                            </button>
                            <div className="text-sm text-slate-600">
                                <span className="font-semibold">{selectedProductObjects.length}</span> selected
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 m-4 rounded-r-lg">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <div>
                                    <p className="text-amber-800 font-medium">Note</p>
                                    <p className="text-amber-700 text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Loader className="animate-spin text-light-blue-600 mx-auto mb-4" size={48} />
                                <p className="text-slate-600">Loading products from Google Sheets...</p>
                                <p className="text-slate-400 text-sm mt-1">Please wait while we fetch all product data</p>
                            </div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-8">
                                <FileText className="mx-auto mb-4 text-slate-400" size={48} />
                                <p className="text-slate-600 font-medium">No products found</p>
                                <p className="text-slate-500 text-sm mt-1">
                                    {searchTerm ? 'Try a different search term' : 'Add products to generate QR codes'}
                                </p>
                                <button
                                    onClick={refreshProducts}
                                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-light-blue-600 to-cyan-600 text-white rounded-xl hover:from-light-blue-700 hover:to-cyan-700 shadow-md transition-all"
                                >
                                    Refresh Products
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* QR Codes Grid */
                        <div ref={qrContainerRef} className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id || product.sn} className="relative">
                                        <div 
                                            onClick={() => toggleProductSelection(product.sn)}
                                            className={`cursor-pointer transition-all duration-300 ${selectedProducts.includes(product.sn) ? 'ring-2 ring-light-blue-500 ring-offset-2' : ''}`}
                                        >
                                            <ProductQRCard 
                                                product={product}
                                                baseUrl={baseUrl}
                                                showLogo={true}
                                            />
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.sn)}
                                                onChange={() => toggleProductSelection(product.sn)}
                                                className="w-5 h-5 rounded border-slate-300 text-light-blue-600 focus:ring-light-blue-500 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                            

                    <button
                        onClick={generatePDF}
                        disabled={generatingPDF || selectedProductObjects.length === 0}
                        className="w-full bg-gradient-to-r from-light-blue-600 to-cyan-600 hover:from-light-blue-700 hover:to-cyan-700 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-lg shadow-light-blue-200 hover:shadow-xl hover:shadow-light-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPDF ? (
                            <>
                                <Loader className="animate-spin" size={22} />
                                <span>Generating PDF Document...</span>
                            </>
                        ) : (
                            <>
                                <Download size={22} />
                                <span>Download {selectedProductObjects.length} QR Codes as PDF</span>
                            </>
                        )}
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center mt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-light-blue-500"></div>
                            <span>Each QR code links to product details page</span>
                        </div>
                        <span>PDF includes company logo and product information</span>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default BulkQRModal;