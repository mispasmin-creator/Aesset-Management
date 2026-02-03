import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    X, Download, ExternalLink, Loader, AlertCircle, 
    Wrench, Calendar, Package, MapPin, Globe, 
    Building, User, Shield, DollarSign, RefreshCw 
} from 'lucide-react';
import { useProduct } from '../context/ProductContext';

// Import company logo
import CompanyLogo from '../assets/logo.png';

const QRCodeModal = ({ isOpen, onClose, product }) => {
    const { products, getRepairsBySn, getMaintenanceBySn, getSpecsBySn } = useProduct();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [productDetails, setProductDetails] = useState(product);
    const [repairs, setRepairs] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [specs, setSpecs] = useState([]);
    const [hasFetched, setHasFetched] = useState(false);
    const qrRef = useRef(null);

    const baseUrl = window.location.origin;

    // Use the product passed directly as much as possible
    useEffect(() => {
        if (isOpen && product) {
            // Reset states when modal opens
            setProductDetails(product);
            setRepairs([]);
            setMaintenance([]);
            setSpecs([]);
            setHasFetched(false);
            
            // Fetch additional details
            fetchProductDetails();
        }
    }, [isOpen, product]);

    const fetchProductDetails = async () => {
        // Prevent multiple fetches
        if (hasFetched || loading || !product?.sn) return;

        try {
            setLoading(true);
            setError(null);
            
            // Find the product from the context
            const foundProduct = products.find(p => 
                p.id?.toString() === product.sn || 
                p.sn?.toString() === product.sn
            );
            
            if (foundProduct) {
                setProductDetails(foundProduct);
                const productSn = foundProduct.sn || foundProduct.id;
                
                if (productSn) {
                    // Get repairs, maintenance, and specs from context
                    const productRepairs = getRepairsBySn(productSn) || [];
                    const productMaintenance = getMaintenanceBySn(productSn) || [];
                    const productSpecs = getSpecsBySn(productSn) || [];
                    
                    // Sort repairs by date (newest first)
                    const sortedRepairs = productRepairs.sort((a, b) => {
                        const dateA = new Date(a.repairDate || a.createdDate || '');
                        const dateB = new Date(b.repairDate || b.createdDate || '');
                        return dateB - dateA;
                    });
                    
                    setRepairs(sortedRepairs);
                    setMaintenance(productMaintenance);
                    setSpecs(productSpecs);
                }
                
                setHasFetched(true);
            } else {
                setError('Product not found in database');
            }
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError('Failed to load product details from Google Sheets');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
        return `₹${parseInt(numAmount || 0).toLocaleString('en-IN')}`;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        try {
            if (dateStr.includes('T')) {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    // Handle download with logo
    const handleDownload = async () => {
  try {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) {
      alert('QR code not found');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);

    // 🔥 High resolution canvas
    const SIZE = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // ❌ Disable smoothing (VERY IMPORTANT)
    ctx.imageSmoothingEnabled = false;

    // Load QR SVG
    const qrImg = new Image();
    const logoImg = new Image();

    qrImg.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)));

    logoImg.src = CompanyLogo;

    await Promise.all([
      new Promise((res) => (qrImg.onload = res)),
      new Promise((res) => (logoImg.onload = res)),
    ]);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Draw QR
    ctx.drawImage(qrImg, 0, 0, SIZE, SIZE);

    // 🟢 SAFE logo size (16%)
    const logoSize = SIZE * 0.16;
    const logoX = (SIZE - logoSize) / 2;
    const logoY = (SIZE - logoSize) / 2;

    // Strong quiet zone
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      logoX - 20,
      logoY - 20,
      logoSize + 40,
      logoSize + 40
    );

    // Draw logo (crisp)
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

    // Optional border
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 6;
    ctx.strokeRect(
      logoX - 20,
      logoY - 20,
      logoSize + 40,
      logoSize + 40
    );

    // ✅ Export as BLOB (best quality)
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-${productDetails?.sn || 'product'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (err) {
    console.error(err);
    alert('Failed to download QR code');
  }
};


    const handleCopyUrl = async () => {
        const productUrl = `${baseUrl}/#/product/${productDetails?.sn || product?.sn}`;
        try {
            await navigator.clipboard.writeText(productUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = productUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    const productSn = productDetails?.sn || product?.sn;
    const productUrl = `${baseUrl}/#/product/${productSn}`;
    
    // Create a proper URL for the QR code - THIS IS WHAT SCANNERS WILL READ
    const qrData = productUrl;

    // Custom QR code renderer with logo
    const renderQRCode = () => {
        const qrSize = 220;
        const logoSize = qrSize * 0.18;
        
        return (
            <div className="relative bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm mb-6">
                <QRCodeSVG
                    id="qr-code-svg"
                    value={qrData}
                    size={qrSize}
                    level="H"
                    includeMargin={true}
                    fgColor="#0f172a" // Dark slate for better contrast
                    bgColor="#ffffff"
                    ref={qrRef}
                />
                {/* Overlay logo in center */}
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: `${logoSize}px`,
                        height: `${logoSize}px`,
                    }}
                >
                    <div className="w-full h-full bg-white rounded-md flex items-center justify-center border-2 border-light-blue-300 shadow-sm">
                        <img 
                            src={CompanyLogo} 
                            alt="Company Logo" 
                            className="w-4/5 h-4/5 object-contain"
                            onError={(e) => {
                                console.error('Failed to load logo image');
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full bg-gradient-to-br from-light-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
                                        <span class="text-white font-bold text-xs">COMPANY</span>
                                    </div>
                                `;
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-light-blue-600 to-light-blue-700 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Product QR Code</h2>
                            <p className="text-white/80 text-sm">
                                {productDetails?.productName || product?.productName || 'Product'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchProductDetails}
                            disabled={loading}
                            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Refresh Data"
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

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Panel - QR Code */}
                    <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col items-center justify-center">
                        {/* QR Code with Logo */}
                        {renderQRCode()}
                        
                        <div className="text-center mb-6">
                            <p className="font-bold text-slate-900 text-lg">
                                {productSn || 'N/A'}
                            </p>
                            <p className="text-slate-600 mt-1">
                                {productDetails?.productName || product?.productName || 'Product'}
                            </p>
                            <p className="text-slate-500 text-sm mt-2">
                                Scan to view complete details
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                <p className="text-xs text-slate-500">Live Product QR</p>
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={handleDownload}
                                className="w-full bg-gradient-to-r from-light-blue-600 to-cyan-600 hover:from-light-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium shadow-lg shadow-light-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                <Download size={18} />
                                {loading ? 'Loading...' : 'Download QR Code'}
                            </button>
                            
                            <button
                                onClick={handleCopyUrl}
                                className="w-full bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 text-slate-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                <ExternalLink size={18} />
                                {copied ? 'URL Copied!' : 'Copy Product URL'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Product Details */}
                    <div className="md:w-2/3 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader className="animate-spin text-light-blue-600 mb-4" size={32} />
                                <p className="text-slate-600">Fetching product details from Google Sheets...</p>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                                    <p className="text-red-600 font-medium mb-2">Error loading details</p>
                                    <p className="text-slate-600 mb-4">{error}</p>
                                    <button
                                        onClick={fetchProductDetails}
                                        className="px-4 py-2 bg-gradient-to-r from-light-blue-600 to-cyan-600 text-white rounded-lg hover:from-light-blue-700 hover:to-cyan-700 shadow-md transition-all"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* URL Info */}
                                <div className="bg-gradient-to-r from-light-blue-50 to-cyan-50 rounded-lg p-4 border border-light-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Globe size={16} className="text-light-blue-600" />
                                            <p className="text-sm font-medium text-light-blue-800">QR Code Points to:</p>
                                        </div>
                                        <button
                                            onClick={handleCopyUrl}
                                            className="text-slate-500 hover:text-light-blue-600 p-1 transition-colors"
                                            title="Copy URL"
                                        >
                                            {copied ? (
                                                <span className="text-green-600 text-xs font-medium">Copied!</span>
                                            ) : (
                                                <span className="text-xs text-light-blue-600 font-medium">Copy</span>
                                            )}
                                        </button>
                                    </div>
                                    <code className="text-xs text-light-blue-600 break-all block bg-white p-3 rounded border border-light-blue-200 font-mono">
                                        {productUrl}
                                    </code>
                                </div>

                                {/* Basic Info */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Package size={20} className="text-light-blue-600" />
                                        Product Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Brand/Model</p>
                                            <p className="font-medium">{productDetails?.brand || 'N/A'} {productDetails?.model || ''}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Category/Type</p>
                                            <p className="font-medium">{productDetails?.category || 'N/A'} • {productDetails?.type || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Status</p>
                                            <p className={`font-medium ${productDetails?.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                                                {productDetails?.status || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Asset Value</p>
                                            <p className="font-medium text-green-600">{formatCurrency(productDetails?.assetValue || productDetails?.cost || 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Info */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <MapPin size={20} className="text-indigo-600" />
                                        Location & Assignment
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Location</p>
                                            <p className="font-medium">{productDetails?.location || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Department</p>
                                            <p className="font-medium">{productDetails?.department || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Assigned To</p>
                                            <p className="font-medium">{productDetails?.assignedTo || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Responsible Person</p>
                                            <p className="font-medium">{productDetails?.responsible || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Warranty & Maintenance */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Shield size={20} className="text-teal-600" />
                                        Warranty & Maintenance
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Warranty</p>
                                            <p className={`font-medium ${productDetails?.warranty === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                                                {productDetails?.warranty || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">AMC</p>
                                            <p className={`font-medium ${productDetails?.amc === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                                                {productDetails?.amc || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Maintenance Required</p>
                                            <p className={`font-medium ${productDetails?.maintenance === 'Yes' ? 'text-amber-600' : 'text-green-600'}`}>
                                                {productDetails?.maintenance || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Priority</p>
                                            <p className={`font-medium ${
                                                productDetails?.priority === 'High' ? 'text-red-600' :
                                                productDetails?.priority === 'Medium' ? 'text-amber-600' :
                                                'text-blue-600'
                                            }`}>
                                                {productDetails?.priority || 'Normal'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Show repairs if available */}
                                {repairs.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Wrench size={20} className="text-rose-600" />
                                            Recent Repairs ({repairs.length})
                                        </h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {repairs.slice(0, 3).map((repair, index) => (
                                                <div key={index} className="bg-gradient-to-br from-rose-50 to-pink-50 p-3 rounded-lg border border-rose-100">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-sm">{formatDate(repair.repairDate || repair.DateRepair)}</p>
                                                            <p className="text-xs text-slate-600">Cost: {formatCurrency(repair.repairCost || repair.RepairCost)}</p>
                                                        </div>
                                                        <span className="bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 text-xs px-2 py-1 rounded font-medium">
                                                            {repair.partChanged || repair.PartChanged === 'Yes' ? 'Parts Changed' : 'No Parts'}
                                                        </span>
                                                    </div>
                                                    {(repair.partChanged === 'Yes' || repair.PartChanged === 'Yes') && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-slate-500">Parts:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {[
                                                                    repair.part1 || repair.Part1,
                                                                    repair.part2 || repair.Part2,
                                                                    repair.part3 || repair.Part3,
                                                                    repair.part4 || repair.Part4,
                                                                    repair.part5 || repair.Part5
                                                                ]
                                                                    .filter(part => part && part !== '-' && part !== '')
                                                                    .map((part, idx) => (
                                                                        <span key={idx} className="bg-white border border-rose-200 text-rose-700 text-xs px-2 py-0.5 rounded">
                                                                            {part}
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show maintenance if available */}
                                {maintenance.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <Calendar size={20} className="text-amber-600" />
                                            Upcoming Maintenance ({maintenance.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {maintenance.slice(0, 2).map((maint, index) => (
                                                <div key={index} className={`p-3 rounded-lg border ${
                                                    maint.priority === 'High' 
                                                        ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100' 
                                                        : maint.priority === 'Medium' 
                                                            ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100' 
                                                            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100'
                                                }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-sm">{formatDate(maint.nextServiceDate || maint.NextServiceDate)}</p>
                                                            <p className="text-xs text-slate-600">{maint.maintenanceType || maint.Type || 'Preventive'} • {maint.frequency || maint.Frequency || 'Quarterly'}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            maint.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                                            maint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {maint.priority || 'Low'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-2">{maint.notes || maint.TechnicianNotes || 'Scheduled maintenance'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Financial Info */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <DollarSign size={20} className="text-emerald-600" />
                                        Financial Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Cost</p>
                                            <p className="font-medium text-green-600">{formatCurrency(productDetails?.cost || 0)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Asset Value</p>
                                            <p className="font-medium text-green-600">{formatCurrency(productDetails?.assetValue || 0)}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Total Repairs</p>
                                            <p className="font-medium">{productDetails?.count || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-200">
                                            <p className="text-slate-500 text-xs">Last Repair Cost</p>
                                            <p className="font-medium text-rose-600">{formatCurrency(productDetails?.lastCost || 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Updated Info */}
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <User size={12} />
                                            <span>Created by: {productDetails?.createdBy || 'System'}</span>
                                        </div>
                                        <span>Last Updated: {formatDate(productDetails?.timestamp) || new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
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

export default QRCodeModal;