import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Loader, Save, Camera } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

// Reusable InputField component (same as before)
const InputField = ({ label, name, type = "text", value, onChange, placeholder, options, required = false, disabled = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent bg-white ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                required={required}
            >
                <option value="">Select {label}</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        ) : type === 'textarea' ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                rows="3"
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder={placeholder}
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder={placeholder}
                required={required}
            />
        )}
    </div>
);

// Section Header component (same as before)
const SectionHeader = ({ title, subtitle = "" }) => (
    <div className="border-b border-light-blue-100 pb-2 mb-4 mt-2">
        <h3 className="text-lg font-bold text-light-blue-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
);

// Dynamic Spec Row component (same as before)
const SpecRow = ({ spec, index, onChange, onRemove }) => (
    <div className="flex gap-4 items-end">
        <div className="flex-1">
            <InputField 
                label="Spec Name" 
                value={spec.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                placeholder="e.g. RAM, Capacity, Weight"
            />
        </div>
        <div className="flex-1">
            <InputField 
                label="Value" 
                value={spec.value}
                onChange={(e) => onChange(index, 'value', e.target.value)}
                placeholder="e.g. 16GB, 500GB, 2.5kg"
            />
        </div>
        <button 
            type="button" 
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded mb-1"
        >
            <Trash2 size={20} />
        </button>
    </div>
);

// Part Name Row component (same as before)
const PartNameRow = ({ part, index, onChange, onRemove }) => (
    <div className="flex gap-2 items-center">
        <input
            type="text"
            value={part}
            onChange={(e) => onChange(index, e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500"
            placeholder={`Part Name ${index + 1}`}
        />
        <button 
            type="button" 
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
        >
            <Trash2 size={18} />
        </button>
    </div>
);

const AddProductModal = ({ isOpen, onClose, product = null }) => {
    const { addProduct, updateProduct, refreshProducts } = useProduct();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageUploading, setImageUploading] = useState(false);

    // Initial form state
    const initialFormData = {
        // Section 1: Basic Information
        productName: '',
        category: 'IT',
        type: 'Asset',
        brand: '',
        model: '',
        serialNo: '', // Will be auto-generated
        sku: '',
        mfgDate: '',
        origin: 'India',
        status: 'Active',
        
        // Section 2: Asset Information
        assetDate: '',
        invoiceNo: '',
        assetValue: '',
        quantity: '1',
        supplierName: '',
        supplierPhone: '',
        supplierEmail: '',
        paymentMode: 'Online',
        
        // Section 3: Location & Ownership
        location: 'Warehouse',
        department: 'IT',
        assignedTo: '',
        usageType: 'Internal',
        storageLoc: '',
        responsiblePerson: '',
        
        // Section 4: Warranty & Service
        warrantyAvailable: 'No',
        warrantyProvider: '',
        warrantyStart: '',
        warrantyEnd: '',
        amc: 'No',
        amcProvider: '',
        amcStart: '',
        amcEnd: '',
        serviceContact: '',
        
        // Section 5: Maintenance (Goes to Product_Maintenance sheet)
        maintenanceRequired: 'No',
        maintenanceType: 'Preventive',
        frequency: 'Monthly',
        nextService: '',
        priority: 'Medium',
        technician: '',
        maintenanceNotes: '',
        
        // Section 7: Technical Specifications (Goes to Product_Specs sheet)
        specs: [],
        
        // Section 8: Financial & Depreciation
        depMethod: 'Straight Line',
        depRate: '10',
        assetLife: '5',
        residualValue: '0',
        
        // Section 9: Notes & Remarks
        internalNotes: '',
        usageRemarks: '',
        condition: 'Good',
        
        // Section 10: Repair Details (Goes to Product_Repairs sheet)
        lastRepairDate: '',
        repairCost: '0',
        partChanged: 'No',
        partNames: [],
        repairCount: '0',
        totalRepairCost: '0',
        repairRemarks: '',
        repairTechnician: '',
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isOpen) {
            setSubmitError(null);
            setSubmitSuccess(false);
            setUploadedImages([]);
            
            if (product) {
                // Edit Mode: Populate form with existing product data
                setFormData({
                    ...initialFormData,
                    ...product,
                    // Ensure arrays are properly initialized
                    specs: product.specs || [],
                    partNames: product.partNames || [],
                    // Ensure numeric fields are strings
                    assetValue: product.assetValue?.toString() || '',
                    quantity: product.quantity?.toString() || '1',
                    repairCost: product.repairCost?.toString() || '0',
                    repairCount: product.repairCount?.toString() || '0',
                    totalRepairCost: product.totalRepairCost?.toString() || '0',
                    depRate: product.depRate?.toString() || '10',
                    assetLife: product.assetLife?.toString() || '5',
                    residualValue: product.residualValue?.toString() || '0',
                });
            } else {
                // Add Mode: Reset to initial state
                setFormData(initialFormData);
                // Auto-generate serial number for new product
                generateSerialNumber();
            }
        }
    }, [isOpen, product]);

    // Format date to dd/mm/yy hh:mm:ss
    const formatTimestamp = (date = new Date()) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    // Auto-generate serial number
    const generateSerialNumber = async () => {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbyzZ_KxsII2w95PsqH3JprWCCiQRehkRTrnNQmQWVWYX8vosFClyTtTSawjAUPzDs9a/exec?action=getNextSN');
            const data = await response.json();
            
            if (data.success && data.nextSN) {
                // Format as SN-0001, SN-0002, etc.
                const snNumber = data.nextSN.toString().padStart(4, '0');
                setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
            } else {
                // Fallback: get from local storage or generate
                const lastSN = localStorage.getItem('lastSN') || '0';
                const nextSN = parseInt(lastSN) + 1;
                const snNumber = nextSN.toString().padStart(4, '0');
                localStorage.setItem('lastSN', nextSN.toString());
                setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
            }
        } catch (error) {
            console.error('Error generating serial number:', error);
            // Client-side fallback
            const lastSN = localStorage.getItem('lastSN') || '0';
            const nextSN = parseInt(lastSN) + 1;
            const snNumber = nextSN.toString().padStart(4, '0');
            localStorage.setItem('lastSN', nextSN.toString());
            setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle spec changes (same as before)
    const handleSpecChange = (index, field, value) => {
        const newSpecs = [...formData.specs];
        if (!newSpecs[index]) newSpecs[index] = { name: '', value: '' };
        newSpecs[index][field] = value;
        setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    // Add new spec (same as before)
    const addSpec = () => {
        setFormData(prev => ({ 
            ...prev, 
            specs: [...prev.specs, { name: '', value: '' }] 
        }));
    };

    // Remove spec (same as before)
    const removeSpec = (index) => {
        const newSpecs = formData.specs.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    // Handle part name changes (same as before)
    const handlePartNameChange = (index, value) => {
        const newParts = [...formData.partNames];
        newParts[index] = value;
        setFormData(prev => ({ ...prev, partNames: newParts }));
    };

    // Add new part name (same as before)
    const addPartName = () => {
        if (formData.partNames.length < 5) {
            setFormData(prev => ({ 
                ...prev, 
                partNames: [...prev.partNames, ''] 
            }));
        }
    };

    // Remove part name (same as before)
    const removePartName = (index) => {
        const newParts = formData.partNames.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, partNames: newParts }));
    };

    // Handle image upload to Google Drive
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setImageUploading(true);
        try {
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    setSubmitError(`File ${file.name} is too large. Max size is 10MB.`);
                    continue;
                }

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('action', 'uploadFile');
                formData.append('file', file);
                formData.append('folderId', '1nJIhEL_6BTLuZ3mu3XLPJOES-95ZlFwf');
                
                const response = await fetch('https://script.google.com/macros/s/AKfycbyzZ_KxsII2w95PsqH3JprWCCiQRehkRTrnNQmQWVWYX8vosFClyTtTSawjAUPzDs9a/exec', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success && data.fileUrl) {
                    setUploadedImages(prev => [...prev, {
                        name: file.name,
                        url: data.fileUrl,
                        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        driveId: data.fileId
                    }]);
                } else {
                    setSubmitError(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            setSubmitError('Failed to upload images. Please try again.');
        } finally {
            setImageUploading(false);
        }
    };

    // Remove uploaded image
    const removeImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            // Basic validation
            if (!formData.productName.trim()) {
                throw new Error('Product Name is required');
            }

            if (!formData.serialNo.trim()) {
                throw new Error('Serial Number is required');
            }

            // Get formatted timestamp for all submissions
            const currentTimestamp = formatTimestamp();
            
            if (product) {
                // EDIT MODE - Update existing product
                
                // 1. Update main product information in Products sheet
                const mainProductData = {
                    ...formData,
                    // Convert numeric strings to numbers
                    assetValue: parseFloat(formData.assetValue) || 0,
                    quantity: parseInt(formData.quantity) || 1,
                    repairCost: parseFloat(formData.repairCost) || 0,
                    repairCount: parseInt(formData.repairCount) || 0,
                    totalRepairCost: parseFloat(formData.totalRepairCost) || 0,
                    depRate: parseFloat(formData.depRate) || 10,
                    assetLife: parseInt(formData.assetLife) || 5,
                    residualValue: parseFloat(formData.residualValue) || 0,
                    updatedBy: 'admin',
                    updatedDate: currentTimestamp, // Formatted timestamp
                    // Add image URL if uploaded
                    image_url: uploadedImages.length > 0 ? uploadedImages[0].url : product.image_url || '',
                    tags: formData.category
                };
                
                // 2. If there are repair details, add to Product_Repairs sheet
                if (formData.lastRepairDate && formData.repairCost && formData.repairCost !== '0') {
                    const repairData = {
                        'Product SN': formData.serialNo,
                        'Repair Date': formData.lastRepairDate,
                        'Repair Cost': parseFloat(formData.repairCost) || 0,
                        'Part Changed': formData.partChanged,
                        'Part 1': formData.partNames[0] || '',
                        'Part 2': formData.partNames[1] || '',
                        'Part 3': formData.partNames[2] || '',
                        'Part 4': formData.partNames[3] || '',
                        'Part 5': formData.partNames[4] || '',
                        'Technician': formData.repairTechnician || '',
                        'Remarks': formData.repairRemarks || '',
                        'Created Date': currentTimestamp // Formatted timestamp
                    };
                    
                    // Submit to Product_Repairs sheet
                    await submitToSheet('Product_Repairs', repairData);
                }
                
                // 3. If there are maintenance details, add to Product_Maintenance sheet
                if (formData.maintenanceRequired === 'Yes') {
                    const maintenanceData = {
                        'Product SN': formData.serialNo,
                        'Maintenance Required': formData.maintenanceRequired,
                        'Maintenance Type': formData.maintenanceType,
                        'Frequency': formData.frequency,
                        'Next Service Date': formData.nextService,
                        'Priority': formData.priority,
                        'Technician': formData.technician,
                        'Notes': formData.maintenanceNotes,
                        'Created Date': currentTimestamp // Formatted timestamp
                    };
                    
                    // Submit to Product_Maintenance sheet
                    await submitToSheet('Product_Maintenance', maintenanceData);
                }
                
                // 4. If there are specs, add to Product_Specs sheet
                if (formData.specs.length > 0) {
                    for (const spec of formData.specs) {
                        if (spec.name && spec.value) {
                            const specData = {
                                'Product SN': formData.serialNo,
                                'Spec Name': spec.name,
                                'Spec Value': spec.value,
                                'Created Date': currentTimestamp // Formatted timestamp
                            };
                            
                            // Submit to Product_Specs sheet
                            await submitToSheet('Product_Specs', specData);
                        }
                    }
                }
                
                // 5. Update main product in Products sheet
                await updateProduct(product.id, mainProductData);
                
                setSubmitSuccess(true);
                setTimeout(() => {
                    onClose();
                    refreshProducts();
                }, 1500);
                
            } else {
                // ADD MODE - Create new product
                
                // 1. Prepare main product data for Products sheet
                const mainProductData = {
                    // Map form fields to sheet columns
                    'Timestamp': currentTimestamp, // Formatted timestamp
                    'Serial No': formData.serialNo,
                    'Product Name': formData.productName,
                    'Category': formData.category,
                    'Type': formData.type,
                    'Brand': formData.brand,
                    'Model': formData.model,
                    'SKU': formData.sku,
                    'Mfg Date': formData.mfgDate,
                    'Origin': formData.origin,
                    'Status': formData.status,
                    'Asset Date': formData.assetDate,
                    'Invoice No': formData.invoiceNo,
                    'Cost': parseFloat(formData.assetValue) || 0,
                    'Qty': parseInt(formData.quantity) || 1,
                    'Supplier': formData.supplierName,
                    'Payment': formData.paymentMode,
                    'Location': formData.location,
                    'Department': formData.department,
                    'Assigned To': formData.assignedTo,
                    'Responsible': formData.responsiblePerson,
                    'Warranty': formData.warrantyAvailable,
                    'AMC': formData.amc,
                    'Maintenance': formData.maintenanceRequired,
                    'Priority': formData.priority,
                    'Last Repair': formData.lastRepairDate || '',
                    'Last Cost': parseFloat(formData.repairCost) || 0,
                    'Part Chg?': formData.partChanged,
                    'Part 1': formData.partNames[0] || '',
                    'Part 2': formData.partNames[1] || '',
                    'Part 3': formData.partNames[2] || '',
                    'Part 4': formData.partNames[3] || '',
                    'Part 5': formData.partNames[4] || '',
                    'Count': parseInt(formData.repairCount) || 0,
                    'Total Cost': parseFloat(formData.totalRepairCost) || 0,
                    'Asset Value': parseFloat(formData.assetValue) || 0,
                    'Dep. Method': formData.depMethod,
                    'Created By': 'admin',
                    // New columns
                    'id': '', // Will be auto-generated by sheet
                    'supplierPhone': formData.supplierPhone,
                    'supplierEmail': formData.supplierEmail,
                    'usageType': formData.usageType,
                    'storageLoc': formData.storageLoc,
                    'warrantyProvider': formData.warrantyProvider,
                    'warrantyStart': formData.warrantyStart,
                    'warrantyEnd': formData.warrantyEnd,
                    'amcProvider': formData.amcProvider,
                    'amcStart': formData.amcStart,
                    'amcEnd': formData.amcEnd,
                    'serviceContact': formData.serviceContact,
                    'maintenanceType': formData.maintenanceType,
                    'frequency': formData.frequency,
                    'nextService': formData.nextService,
                    'technician': formData.technician,
                    'maintenanceNotes': formData.maintenanceNotes,
                    'depRate': parseFloat(formData.depRate) || 10,
                    'assetLife': parseInt(formData.assetLife) || 5,
                    'residualValue': parseFloat(formData.residualValue) || 0,
                    'internalNotes': formData.internalNotes,
                    'usageRemarks': formData.usageRemarks,
                    'condition': formData.condition,
                    'updatedBy': '',
                    'updatedDate': '',
                    'qr_code_url': '',
                    'image_url': uploadedImages.length > 0 ? uploadedImages[0].url : '',
                    'tags': formData.category,
                    // Add edition column
                    'edition': '1', // Default edition
                    'updatedBy': 'admin',
                    'updatedDate': currentTimestamp // Formatted timestamp
                };
                
                // 2. Submit main product to Products sheet
                await submitToSheet('Products', mainProductData);
                
                // 3. If there are repair details, add to Product_Repairs sheet
                if (formData.lastRepairDate && formData.repairCost && formData.repairCost !== '0') {
                    const repairData = {
                        'Product SN': formData.serialNo,
                        'Repair Date': formData.lastRepairDate,
                        'Repair Cost': parseFloat(formData.repairCost) || 0,
                        'Part Changed': formData.partChanged,
                        'Part 1': formData.partNames[0] || '',
                        'Part 2': formData.partNames[1] || '',
                        'Part 3': formData.partNames[2] || '',
                        'Part 4': formData.partNames[3] || '',
                        'Part 5': formData.partNames[4] || '',
                        'Technician': formData.repairTechnician || '',
                        'Remarks': formData.repairRemarks || '',
                        'Created Date': currentTimestamp // Formatted timestamp
                    };
                    
                    // Submit to Product_Repairs sheet
                    await submitToSheet('Product_Repairs', repairData);
                }
                
                // 4. If there are maintenance details, add to Product_Maintenance sheet
                if (formData.maintenanceRequired === 'Yes') {
                    const maintenanceData = {
                        'Product SN': formData.serialNo,
                        'Maintenance Required': formData.maintenanceRequired,
                        'Maintenance Type': formData.maintenanceType,
                        'Frequency': formData.frequency,
                        'Next Service Date': formData.nextService,
                        'Priority': formData.priority,
                        'Technician': formData.technician,
                        'Notes': formData.maintenanceNotes,
                        'Created Date': currentTimestamp // Formatted timestamp
                    };
                    
                    // Submit to Product_Maintenance sheet
                    await submitToSheet('Product_Maintenance', maintenanceData);
                }
                
                // 5. If there are specs, add to Product_Specs sheet
                if (formData.specs.length > 0) {
                    for (const spec of formData.specs) {
                        if (spec.name && spec.value) {
                            const specData = {
                                'Product SN': formData.serialNo,
                                'Spec Name': spec.name,
                                'Spec Value': spec.value,
                                'Created Date': currentTimestamp // Formatted timestamp
                            };
                            
                            // Submit to Product_Specs sheet
                            await submitToSheet('Product_Specs', specData);
                        }
                    }
                }
                
                setSubmitSuccess(true);
                setTimeout(() => {
                    onClose();
                    refreshProducts();
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setSubmitError(error.message || 'Failed to save product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to submit data to specific sheet
    const submitToSheet = async (sheetName, data) => {
        try {
            // Convert object to array in correct column order
            const rowData = Object.values(data);
            
            const response = await fetch('https://script.google.com/macros/s/AKfycbyzZ_KxsII2w95PsqH3JprWCCiQRehkRTrnNQmQWVWYX8vosFClyTtTSawjAUPzDs9a/exec', {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'insert',
                    sheetName: sheetName,
                    rowData: JSON.stringify(rowData)
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(`Failed to save to ${sheetName}: ${result.error}`);
            }
            
            return result;
        } catch (error) {
            console.error(`Error submitting to ${sheetName}:`, error);
            throw error;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-light-blue-600 to-light-blue-700 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {product ? `Editing: ${product.productName}` : 'Fill in all required fields (*)'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Status Messages */}
                {submitError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <X className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{submitError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {submitSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-6 mt-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Save className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    {product ? 'Product updated successfully!' : 'Product added successfully!'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* SECTION 1: Basic Product Information */}
                        <section>
                            <SectionHeader 
                                title="SECTION 1: Basic Product Information" 
                                subtitle="Core details about the product"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Product Name *" 
                                    name="productName" 
                                    value={formData.productName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter product name"
                                />
                                <InputField 
                                    label="Category" 
                                    name="category" 
                                    type="select"
                                    options={['Electronics', 'IT', 'Machinery', 'Furniture', 'Tools', 'Office Equipment']}
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Type" 
                                    name="type" 
                                    type="select"
                                    options={['Asset', 'Consumable', 'Non-Consumable']}
                                    value={formData.type}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Brand/Manufacturer" 
                                    name="brand" 
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="Enter brand name"
                                />
                                <InputField 
                                    label="Model Number" 
                                    name="model" 
                                    value={formData.model}
                                    onChange={handleChange}
                                    placeholder="Enter model number"
                                />
                                <InputField 
                                    label="Serial Number *" 
                                    name="serialNo" 
                                    value={formData.serialNo}
                                    onChange={handleChange}
                                    required
                                    disabled={!!product} // Disable editing of SN for existing products
                                    placeholder="Auto-generated (e.g., SN-0001)"
                                />
                                <InputField 
                                    label="SKU / Product Code" 
                                    name="sku" 
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="Enter SKU code"
                                />
                                <InputField 
                                    label="Manufacturing Date" 
                                    name="mfgDate" 
                                    type="date"
                                    value={formData.mfgDate}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Country of Origin" 
                                    name="origin" 
                                    type="select"
                                    options={['India', 'China', 'USA', 'Germany', 'Japan', 'South Korea', 'Taiwan']}
                                    value={formData.origin}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Status" 
                                    name="status" 
                                    type="select"
                                    options={['Active', 'Inactive', 'Under Maintenance', 'Disposed']}
                                    value={formData.status}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 2: Asset Information */}
                        <section>
                            <SectionHeader 
                                title="SECTION 2: Asset Information" 
                                subtitle="Purchase and financial details"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Asset Date" 
                                    name="assetDate" 
                                    type="date"
                                    value={formData.assetDate}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Invoice Number" 
                                    name="invoiceNo" 
                                    value={formData.invoiceNo}
                                    onChange={handleChange}
                                    placeholder="Enter invoice number"
                                />
                                <InputField 
                                    label="Asset Value (₹)" 
                                    name="assetValue" 
                                    type="number"
                                    value={formData.assetValue}
                                    onChange={handleChange}
                                    placeholder="Enter cost"
                                />
                                <InputField 
                                    label="Quantity" 
                                    name="quantity" 
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="Enter quantity"
                                />
                                <InputField 
                                    label="Supplier Name" 
                                    name="supplierName" 
                                    value={formData.supplierName}
                                    onChange={handleChange}
                                    placeholder="Enter supplier name"
                                />
                                <InputField 
                                    label="Supplier Phone" 
                                    name="supplierPhone" 
                                    value={formData.supplierPhone}
                                    onChange={handleChange}
                                    placeholder="Enter supplier phone"
                                />
                                <InputField 
                                    label="Supplier Email" 
                                    name="supplierEmail" 
                                    type="email"
                                    value={formData.supplierEmail}
                                    onChange={handleChange}
                                    placeholder="Enter supplier email"
                                />
                                <InputField 
                                    label="Payment Mode" 
                                    name="paymentMode" 
                                    type="select"
                                    options={['Online', 'Cash', 'Credit', 'Cheque', 'Bank Transfer']}
                                    value={formData.paymentMode}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 3: Location & Ownership */}
                        <section>
                            <SectionHeader 
                                title="SECTION 3: Location & Ownership" 
                                subtitle="Where and who uses this product"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Assigned Location" 
                                    name="location" 
                                    type="select"
                                    options={['Warehouse', 'Office', 'Plant Floor 1', 'IT Server Room', 'Admin Building', 'Lab']}
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Department" 
                                    name="department" 
                                    type="select"
                                    options={['IT', 'Production', 'Admin', 'Finance', 'HR', 'Marketing', 'R&D']}
                                    value={formData.department}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Assigned To" 
                                    name="assignedTo" 
                                    value={formData.assignedTo}
                                    onChange={handleChange}
                                    placeholder="Employee or team name"
                                />
                                <InputField 
                                    label="Usage Type" 
                                    name="usageType" 
                                    type="select"
                                    options={['Internal', 'External', 'Rental', 'Leased']}
                                    value={formData.usageType}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Storage Location" 
                                    name="storageLoc" 
                                    value={formData.storageLoc}
                                    onChange={handleChange}
                                    placeholder="Rack / Room / Shelf details"
                                />
                                <InputField 
                                    label="Responsible Person" 
                                    name="responsiblePerson" 
                                    value={formData.responsiblePerson}
                                    onChange={handleChange}
                                    placeholder="Person in charge"
                                />
                            </div>
                        </section>

                        {/* SECTION 4: Warranty & Service Details */}
                        <section>
                            <SectionHeader 
                                title="SECTION 4: Warranty & Service Details" 
                                subtitle="Warranty and maintenance contract information"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Warranty Available" 
                                    name="warrantyAvailable" 
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.warrantyAvailable}
                                    onChange={handleChange}
                                />
                                
                                {formData.warrantyAvailable === 'Yes' && (
                                    <>
                                        <InputField 
                                            label="Warranty Provider" 
                                            name="warrantyProvider" 
                                            value={formData.warrantyProvider}
                                            onChange={handleChange}
                                            placeholder="Warranty provider name"
                                        />
                                        <InputField 
                                            label="Warranty Start Date" 
                                            name="warrantyStart" 
                                            type="date"
                                            value={formData.warrantyStart}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="Warranty End Date" 
                                            name="warrantyEnd" 
                                            type="date"
                                            value={formData.warrantyEnd}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}

                                <InputField 
                                    label="AMC Contract" 
                                    name="amc" 
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.amc}
                                    onChange={handleChange}
                                />
                                
                                {formData.amc === 'Yes' && (
                                    <>
                                        <InputField 
                                            label="AMC Provider" 
                                            name="amcProvider" 
                                            value={formData.amcProvider}
                                            onChange={handleChange}
                                            placeholder="AMC provider name"
                                        />
                                        <InputField 
                                            label="AMC Start Date" 
                                            name="amcStart" 
                                            type="date"
                                            value={formData.amcStart}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="AMC End Date" 
                                            name="amcEnd" 
                                            type="date"
                                            value={formData.amcEnd}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}

                                <InputField 
                                    label="Service Contact" 
                                    name="serviceContact" 
                                    value={formData.serviceContact}
                                    onChange={handleChange}
                                    placeholder="Service helpline or contact"
                                />
                            </div>
                        </section>

                        {/* SECTION 5: Maintenance Configuration */}
                        <section>
                            <SectionHeader 
                                title="SECTION 5: Maintenance Configuration" 
                                subtitle="Maintenance schedule and requirements - Will be saved in Product_Maintenance sheet"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Maintenance Required" 
                                    name="maintenanceRequired" 
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.maintenanceRequired}
                                    onChange={handleChange}
                                />
                                
                                {formData.maintenanceRequired === 'Yes' && (
                                    <>
                                        <InputField 
                                            label="Maintenance Type" 
                                            name="maintenanceType" 
                                            type="select"
                                            options={['Preventive', 'Breakdown', 'Predictive', 'Corrective']}
                                            value={formData.maintenanceType}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="Frequency" 
                                            name="frequency" 
                                            type="select"
                                            options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']}
                                            value={formData.frequency}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="Next Service Date" 
                                            name="nextService" 
                                            type="date"
                                            value={formData.nextService}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="Priority" 
                                            name="priority" 
                                            type="select"
                                            options={['Low', 'Medium', 'High', 'Critical']}
                                            value={formData.priority}
                                            onChange={handleChange}
                                        />
                                        <InputField 
                                            label="Technician" 
                                            name="technician" 
                                            value={formData.technician}
                                            onChange={handleChange}
                                            placeholder="Assigned technician"
                                        />
                                        <div className="md:col-span-2">
                                            <InputField 
                                                label="Maintenance Notes" 
                                                name="maintenanceNotes" 
                                                type="textarea"
                                                value={formData.maintenanceNotes}
                                                onChange={handleChange}
                                                placeholder="Special instructions or notes"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* SECTION 6: Image Upload */}
                        <section>
                            <SectionHeader 
                                title="SECTION 6: Product Images" 
                                subtitle="Upload product images (Optional)"
                            />
                            <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                                <Camera className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 mb-3">
                                    Upload Product Images to Google Drive (Max 5 images, 10MB each)
                                </p>
                                
                                <div className="mb-3">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        disabled={imageUploading}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${imageUploading ? 'bg-slate-300' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
                                    >
                                        {imageUploading ? (
                                            <>
                                                <Loader className="animate-spin h-4 w-4" />
                                                Uploading to Google Drive...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Select Images
                                            </>
                                        )}
                                    </label>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Images will be uploaded to Google Drive folder: Product Images
                                    </p>
                                </div>
                                
                                {/* Uploaded Images Preview */}
                                {uploadedImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Uploaded Images:</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {uploadedImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img 
                                                        src={image.url} 
                                                        alt={image.name}
                                                        className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <p className="text-xs text-slate-500 truncate mt-1">{image.name}</p>
                                                    <p className="text-xs text-slate-400">{image.size}</p>
                                                    <a 
                                                        href={image.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-light-blue-600 hover:underline"
                                                    >
                                                        Google Drive Link
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SECTION 7: Technical Specifications */}
                        <section>
                            <SectionHeader 
                                title="SECTION 7: Technical Specifications" 
                                subtitle="Add technical details and specifications - Will be saved in Product_Specs sheet"
                            />
                            <div className="space-y-3">
                                {formData.specs.map((spec, index) => (
                                    <SpecRow
                                        key={index}
                                        spec={spec}
                                        index={index}
                                        onChange={handleSpecChange}
                                        onRemove={removeSpec}
                                    />
                                ))}
                                <button 
                                    type="button"
                                    onClick={addSpec}
                                    className="flex items-center gap-2 text-sm text-light-blue-600 font-medium hover:text-light-blue-700"
                                >
                                    <Plus size={16} /> Add Specification
                                </button>
                            </div>
                        </section>

                        {/* SECTION 8: Financial & Depreciation */}
                        <section>
                            <SectionHeader 
                                title="SECTION 8: Financial & Depreciation" 
                                subtitle="Asset valuation and depreciation details"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Depreciation Method" 
                                    name="depMethod" 
                                    type="select"
                                    options={['Straight Line', 'WDV', 'None']}
                                    value={formData.depMethod}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Depreciation Rate (%)" 
                                    name="depRate" 
                                    type="number"
                                    value={formData.depRate}
                                    onChange={handleChange}
                                    placeholder="Enter rate"
                                />
                                <InputField 
                                    label="Asset Life (Years)" 
                                    name="assetLife" 
                                    type="number"
                                    value={formData.assetLife}
                                    onChange={handleChange}
                                    placeholder="Enter lifespan"
                                />
                                <InputField 
                                    label="Residual Value (₹)" 
                                    name="residualValue" 
                                    type="number"
                                    value={formData.residualValue}
                                    onChange={handleChange}
                                    placeholder="Scrap value"
                                />
                            </div>
                        </section>

                        {/* SECTION 9: Notes & Remarks */}
                        <section>
                            <SectionHeader 
                                title="SECTION 9: Notes & Remarks" 
                                subtitle="Additional information and observations"
                            />
                            <div className="grid grid-cols-1 gap-4">
                                <InputField 
                                    label="Internal Notes" 
                                    name="internalNotes" 
                                    type="textarea"
                                    value={formData.internalNotes}
                                    onChange={handleChange}
                                    placeholder="Internal comments or observations"
                                />
                                <InputField 
                                    label="Usage Remarks" 
                                    name="usageRemarks" 
                                    type="textarea"
                                    value={formData.usageRemarks}
                                    onChange={handleChange}
                                    placeholder="How this product is used"
                                />
                                <InputField 
                                    label="Condition Notes" 
                                    name="condition" 
                                    type="select"
                                    options={['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair']}
                                    value={formData.condition}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 10: Repair Details */}
                        <section>
                            <SectionHeader 
                                title="SECTION 10: Repair History" 
                                subtitle="Past repair and maintenance records - Will be saved in Product_Repairs sheet"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField 
                                    label="Last Repair Date" 
                                    name="lastRepairDate" 
                                    type="date"
                                    value={formData.lastRepairDate}
                                    onChange={handleChange}
                                />
                                <InputField 
                                    label="Last Repair Cost (₹)" 
                                    name="repairCost" 
                                    type="number"
                                    value={formData.repairCost}
                                    onChange={handleChange}
                                    placeholder="Enter cost"
                                />
                                <InputField 
                                    label="Repair Technician" 
                                    name="repairTechnician" 
                                    value={formData.repairTechnician}
                                    onChange={handleChange}
                                    placeholder="Technician name"
                                />
                                <InputField 
                                    label="Repair Remarks" 
                                    name="repairRemarks" 
                                    type="textarea"
                                    value={formData.repairRemarks}
                                    onChange={handleChange}
                                    placeholder="Repair details or notes"
                                />
                                <InputField 
                                    label="Repair Count" 
                                    name="repairCount" 
                                    type="number"
                                    value={formData.repairCount}
                                    onChange={handleChange}
                                    placeholder="Number of repairs"
                                />
                                <InputField 
                                    label="Total Repair Cost (₹)" 
                                    name="totalRepairCost" 
                                    type="number"
                                    value={formData.totalRepairCost}
                                    onChange={handleChange}
                                    placeholder="Total repair cost"
                                />
                                <InputField 
                                    label="Part Changed?" 
                                    name="partChanged" 
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.partChanged}
                                    onChange={handleChange}
                                />
                            </div>

                            {formData.partChanged === 'Yes' && (
                                <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-slate-700">Parts Changed</h4>
                                        <span className="text-xs text-slate-500">Max 5 parts</span>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.partNames.map((part, index) => (
                                            <PartNameRow
                                                key={index}
                                                part={part}
                                                index={index}
                                                onChange={handlePartNameChange}
                                                onRemove={removePartName}
                                            />
                                        ))}
                                        {formData.partNames.length < 5 && (
                                            <button 
                                                type="button"
                                                onClick={addPartName}
                                                className="flex items-center gap-2 text-sm text-light-blue-600 font-medium hover:text-light-blue-700"
                                            >
                                                <Plus size={16} /> Add Part Name
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        <span className="text-red-500">*</span> Required fields
                        <div className="mt-1 text-xs text-slate-400">
                            Serial No: <span className="font-medium">{formData.serialNo}</span>
                            {product && (
                                <span className="ml-4">
                                    Last updated: {product.updatedDate ? formatTimestamp(product.updatedDate) : 'Never'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting || imageUploading}
                            className="px-6 py-2 bg-gradient-to-r from-light-blue-600 to-cyan-600 hover:from-light-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{product ? 'Update Product' : 'Save Product'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;