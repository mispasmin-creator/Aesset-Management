// ProductView.jsx - ENHANCED MOBILE-FRIENDLY VERSION (UPDATED)
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../context/ProductContext';
import { 
  Package, MapPin, Shield, Wrench, DollarSign, CreditCard, 
  CheckCircle, XCircle, Calendar, TrendingUp, Settings, 
  AlertCircle, Truck, Clipboard, Download, History, 
  AlertTriangle, Image as ImageIcon, Phone, Mail,
  User, Tag, FileText, Layers,
  ChevronDown, ChevronUp, ExternalLink, Printer, Share2
} from 'lucide-react';

const ProductView = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { 
    products, 
    getRepairsBySn, 
    getMaintenanceBySn, 
    getSpecsBySn,
    loading: contextLoading 
  } = useProduct();
  
  const [product, setProduct] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    financial: false,
    warranty: false,
    location: false,
    maintenance: false,
    repairs: false,
    notes: false,
    specs: false
  });

  useEffect(() => {
    if (!contextLoading && products.length > 0) {
      const foundProduct = products.find(p => 
        p.id?.toString() === productId || 
        p.sn?.toString() === productId ||
        p.serialNo?.toString() === productId
      );
      
      if (foundProduct) {
        setProduct(foundProduct);
        const productSn = foundProduct.sn || foundProduct.id || foundProduct.serialNo;
        
        if (productSn) {
          const repairsData = getRepairsBySn(productSn) || [];
          const sortedRepairs = repairsData.sort((a, b) => {
            const dateA = new Date(a.repairDate || a.createdDate || '');
            const dateB = new Date(b.repairDate || b.createdDate || '');
            return dateB - dateA;
          });
          setRepairs(sortedRepairs);
          setMaintenance(getMaintenanceBySn(productSn) || []);
          setSpecs(getSpecsBySn(productSn) || []);
        }
      }
      
      setPageLoading(false);
    }
  }, [products, productId, contextLoading, getRepairsBySn, getMaintenanceBySn, getSpecsBySn]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // UPDATED DATE FORMAT FUNCTION - Always returns dd/mm/yy
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-' || dateStr === '' || dateStr === 'undefined' || dateStr === 'null') {
      return '-';
    }
    
    try {
      // Handle various date formats
      let date;
      
      // Handle your specific format: "02T18:30:00.000Z/02/2026"
      if (dateStr.includes('T') && dateStr.includes('Z/')) {
        const parts = dateStr.split('Z/');
        if (parts[1]) {
          const [month, year] = parts[1].split('/');
          if (month && year) {
            const day = '01'; // Default day if not provided
            const shortYear = year.length === 4 ? year.slice(-2) : year;
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${shortYear}`;
          }
        }
      }
      
      // Try to parse as Date object
      date = new Date(dateStr);
      
      // If date is invalid, try to parse manually
      if (isNaN(date.getTime())) {
        // Try dd/mm/yyyy format
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            const fullYear = year.length === 2 ? `20${year}` : year;
            date = new Date(`${fullYear}-${month}-${day}`);
          }
        }
        // Try yyyy-mm-dd format
        else if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts;
            date = new Date(dateStr);
          }
        }
      }
      
      // Final formatting to dd/mm/yy
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
      }
      
      // Return original if all parsing fails
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${parseInt(numAmount || 0).toLocaleString('en-IN')}`;
  };

  if (contextLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">Product ID: {productId}</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const productSn = product.sn || product.id || product.serialNo;
  const isActive = product.status === 'Active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - REMOVED EDIT BUTTON */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3">
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <Printer className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {product.productName || 'Product Details'}
              </h1>
              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {productSn}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isActive ? (
                    <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  ) : (
                    <XCircle className="w-2.5 h-2.5 mr-1" />
                  )}
                  {product.status}
                </span>
                {product.brand && (
                  <span className="text-xs text-gray-600">• {product.brand}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 py-4">
        {/* Quick Stats Bar - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <StatCard 
            icon={DollarSign}
            value={formatCurrency(product.assetValue || product.cost)}
            label="Asset Value"
            color="bg-blue-500"
          />
          <StatCard 
            icon={Package}
            value={product.qty || product.quantity || 1}
            label="Quantity"
            color="bg-green-500"
          />
          <StatCard 
            icon={Shield}
            value={product.warranty === 'Yes' ? 'Active' : 'None'}
            label="Warranty"
            color={product.warranty === 'Yes' ? "bg-teal-500" : "bg-gray-500"}
          />
          <StatCard 
            icon={Wrench}
            value={product.maintenance === 'Yes' ? 'Required' : 'Not Req'}
            label="Maintenance"
            color={product.maintenance === 'Yes' ? "bg-orange-500" : "bg-gray-500"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="space-y-3">
          {/* Basic Information Section */}
          <CollapsibleSection
            title="Basic Information"
            icon={Package}
            isExpanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
            color="bg-blue-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Product Name" value={product.productName} />
              <InfoField label="Category" value={product.category} />
              <InfoField label="Type" value={product.type} />
              <InfoField label="Brand" value={product.brand} />
              <InfoField label="Model" value={product.model} />
              <InfoField label="SKU" value={product.sku} />
              <InfoField label="Serial No" value={productSn} />
              <InfoField label="Origin" value={product.origin} />
              <InfoField label="Mfg Date" value={formatDate(product.mfgDate)} />
              <InfoField label="Condition" value={product.condition} />
            </div>
          </CollapsibleSection>

          {/* Financial Details Section */}
          <CollapsibleSection
            title="Financial Details"
            icon={CreditCard}
            isExpanded={expandedSections.financial}
            onToggle={() => toggleSection('financial')}
            color="bg-green-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Asset Value" value={formatCurrency(product.assetValue)} />
              <InfoField label="Purchase Cost" value={formatCurrency(product.cost)} />
              <InfoField label="Quantity" value={product.qty || product.quantity} />
              <InfoField label="Depreciation Method" value={product.depMethod} />
              <InfoField label="Depreciation Rate" value={product.depRate ? `${product.depRate}%` : '-'} />
              <InfoField label="Asset Life" value={product.assetLife ? `${product.assetLife} years` : '-'} />
              <InfoField label="Residual Value" value={formatCurrency(product.residualValue)} />
              <InfoField label="Invoice No" value={product.invoiceNo} />
              <InfoField label="Asset Date" value={formatDate(product.assetDate)} />
            </div>
          </CollapsibleSection>

          {/* Warranty & AMC Section */}
          <CollapsibleSection
            title="Warranty & AMC"
            icon={Shield}
            isExpanded={expandedSections.warranty}
            onToggle={() => toggleSection('warranty')}
            color="bg-teal-500"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Warranty Available" value={product.warranty} highlight={product.warranty === 'Yes'} />
                <InfoField label="AMC Contract" value={product.amc} highlight={product.amc === 'Yes'} />
              </div>
              
              {product.warranty === 'Yes' && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-1.5 text-sm">
                    <Shield className="w-3.5 h-3.5" />
                    Warranty Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoField label="Warranty Provider" value={product.warrantyProvider} />
                    <InfoField label="Warranty Start" value={formatDate(product.warrantyStart)} />
                    <InfoField label="Warranty End" value={formatDate(product.warrantyEnd)} />
                    <InfoField label="Service Contact" value={product.serviceContact} />
                  </div>
                </div>
              )}

              {product.amc === 'Yes' && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1.5 text-sm">
                    <FileText className="w-3.5 h-3.5" />
                    AMC Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoField label="AMC Provider" value={product.amcProvider} />
                    <InfoField label="AMC Start" value={formatDate(product.amcStart)} />
                    <InfoField label="AMC End" value={formatDate(product.amcEnd)} />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Location & Ownership Section */}
          <CollapsibleSection
            title="Location & Ownership"
            icon={MapPin}
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
            color="bg-indigo-500"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Location" value={product.location} />
              <InfoField label="Department" value={product.department} />
              <InfoField label="Assigned To" value={product.assignedTo} />
              <InfoField label="Responsible Person" value={product.responsible || product.responsiblePerson} />
              <InfoField label="Storage Location" value={product.storageLoc} />
              <InfoField label="Usage Type" value={product.usageType} />
            </div>
          </CollapsibleSection>

          {/* Supplier Information */}
          {(product.supplier || product.supplierName || product.supplierPhone || product.supplierEmail) && (
            <CollapsibleSection
              title="Supplier Information"
              icon={Truck}
              isExpanded={expandedSections.location}
              onToggle={() => toggleSection('location')}
              color="bg-purple-500"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Supplier Name" value={product.supplier || product.supplierName} />
                <InfoField label="Payment Mode" value={product.payment || product.paymentMode} />
                {product.supplierPhone && (
                  <InfoField 
                    label="Supplier Phone" 
                    value={product.supplierPhone}
                    icon={<Phone className="w-3 h-3" />}
                  />
                )}
                {product.supplierEmail && (
                  <InfoField 
                    label="Supplier Email" 
                    value={product.supplierEmail}
                    icon={<Mail className="w-3 h-3" />}
                  />
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Maintenance Section */}
          <CollapsibleSection
            title="Maintenance Details"
            icon={Settings}
            isExpanded={expandedSections.maintenance}
            onToggle={() => toggleSection('maintenance')}
            color="bg-orange-500"
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoField label="Maintenance Required" value={product.maintenance} />
                <InfoField label="Maintenance Type" value={product.maintenanceType} />
                <InfoField label="Frequency" value={product.frequency} />
                <InfoField label="Next Service" value={formatDate(product.nextService)} />
                <InfoField label="Priority" value={product.priority} />
                <InfoField label="Technician" value={product.technician} />
              </div>
              
              {product.maintenanceNotes && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-1 text-sm">Maintenance Notes</h4>
                  <p className="text-gray-700 text-sm">{product.maintenanceNotes}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* REPAIR HISTORY SECTION */}
          <CollapsibleSection
            title="Repair History"
            icon={History}
            isExpanded={expandedSections.repairs}
            onToggle={() => toggleSection('repairs')}
            color="bg-rose-500"
          >
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                  <p className="text-xs text-rose-600 font-medium">Total Repairs</p>
                  <p className="text-lg font-bold text-rose-700">{repairs.length}</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                  <p className="text-xs text-rose-600 font-medium">Total Cost</p>
                  <p className="text-lg font-bold text-rose-700">
                    {formatCurrency(repairs.reduce((sum, r) => sum + (parseFloat(r.repairCost) || 0), 0))}
                  </p>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                  <p className="text-xs text-rose-600 font-medium">Last Repair</p>
                  <p className="text-sm font-bold text-rose-700">
                    {repairs.length > 0 ? formatDate(repairs[0].repairDate) : '-'}
                  </p>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                  <p className="text-xs text-rose-600 font-medium">Parts Changed</p>
                  <p className="text-lg font-bold text-rose-700">
                    {repairs.filter(r => r.partChanged === 'Yes').length}
                  </p>
                </div>
              </div>

              {/* Repair List */}
              {repairs.length > 0 ? (
                <div className="space-y-2">
                  {repairs.map((repair, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <div className="mb-1 sm:mb-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                              #{repairs.length - index}
                            </span>
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatDate(repair.repairDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            Technician: {repair.technician || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Repair Cost</p>
                          <p className="text-base font-bold text-rose-600">
                            {formatCurrency(repair.repairCost)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <p className="text-xs text-gray-500">Parts Changed</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            repair.partChanged === 'Yes' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {repair.partChanged || 'No'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Logged Date</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {formatDate(repair.createdDate)}
                          </p>
                        </div>
                      </div>

                      {repair.partChanged === 'Yes' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Parts Replaced:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[repair.part1, repair.part2, repair.part3, repair.part4, repair.part5]
                              .filter(part => part && part !== '-' && part !== '')
                              .map((part, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs font-medium px-2 py-1 rounded border border-rose-200"
                                >
                                  <Layers className="w-2.5 h-2.5" />
                                  {part}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                      {repair.remarks && repair.remarks.trim() !== '-' && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Remarks:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {repair.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-rose-50 rounded-lg border border-rose-200">
                  <History className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                  <p className="text-rose-600 font-medium">No repair history</p>
                  <p className="text-rose-500 text-xs mt-0.5">No repairs recorded for this product</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Notes & Remarks */}
          {(product.internalNotes || product.usageRemarks || product.repairRemarks) && (
            <CollapsibleSection
              title="Notes & Remarks"
              icon={Clipboard}
              isExpanded={expandedSections.notes}
              onToggle={() => toggleSection('notes')}
              color="bg-amber-500"
            >
              <div className="space-y-2">
                {product.internalNotes && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-1 text-sm">Internal Notes</h4>
                    <p className="text-gray-700 text-sm">{product.internalNotes}</p>
                  </div>
                )}
                {product.usageRemarks && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 text-sm">Usage Remarks</h4>
                    <p className="text-gray-700 text-sm">{product.usageRemarks}</p>
                  </div>
                )}
                {product.repairRemarks && (
                  <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
                    <h4 className="font-semibold text-rose-800 mb-1 text-sm">Repair Remarks</h4>
                    <p className="text-gray-700 text-sm">{product.repairRemarks}</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Product Image */}
          {product.image_url && (
            <CollapsibleSection
              title="Product Image"
              icon={ImageIcon}
              isExpanded={expandedSections.notes}
              onToggle={() => toggleSection('notes')}
              color="bg-pink-500"
            >
              <div className="flex flex-col items-center">
                <img 
                  src={product.image_url} 
                  alt={product.productName}
                  className="w-full max-w-md h-auto rounded-lg border-2 border-white shadow"
                />
                <a 
                  href={product.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 bg-blue-600 text-white font-medium py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Image
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-2 text-center hover:shadow-sm transition-shadow">
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded ${color} text-white mb-1.5 mx-auto`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-base font-bold text-gray-900 truncate">{value}</p>
    <p className="text-xs text-gray-600 truncate">{label}</p>
  </div>
);

const CollapsibleSection = ({ title, icon: Icon, children, isExpanded, onToggle, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-sm transition-shadow">
    <button
      onClick={onToggle}
      className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 rounded-t-lg transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded ${color} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-left text-sm">{title}</h3>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
    {isExpanded && (
      <div className="px-3 py-2 border-t border-gray-200">
        {children}
      </div>
    )}
  </div>
);

const InfoField = ({ label, value, highlight, icon }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-1.5 rounded hover:bg-gray-50">
    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-0">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-xs text-gray-600">{label}</span>
    </div>
    <span className={`text-sm font-bold text-right truncate max-w-[60%] ${
      highlight ? 'text-green-600' : 'text-gray-900'
    }`}>
      {value || '-'}
    </span>
  </div>
);

export default ProductView;