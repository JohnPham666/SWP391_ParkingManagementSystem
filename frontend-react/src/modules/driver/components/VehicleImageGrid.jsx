import React, { useState } from 'react';
import { Row, Col, Upload, Modal } from 'antd';
import { EyeOutlined, DeleteOutlined, IdcardOutlined, UserOutlined, CarOutlined, FileTextOutlined } from '@ant-design/icons';

export const IMAGE_SLOTS = [
    { key: 'ownerportrait', label: 'Owner Portrait', icon: <UserOutlined /> },
    { key: 'idcardfront', label: 'ID Card (Front)', icon: <IdcardOutlined /> },
    { key: 'idcardback', label: 'ID Card (Back)', icon: <IdcardOutlined /> },
    { key: 'vehicle', label: 'Vehicle Image', icon: <CarOutlined /> },
    { key: 'registrationfront', label: 'Registration (Front)', icon: <FileTextOutlined /> },
    { key: 'registrationback', label: 'Registration (Back)', icon: <FileTextOutlined /> }
];

const VehicleImageGrid = ({ value = {}, onChange, mode = 'edit' }) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const handlePreview = (fileOrUrl, title) => {
        let url = fileOrUrl;
        if (typeof fileOrUrl !== 'string' && fileOrUrl instanceof File) {
            url = URL.createObjectURL(fileOrUrl);
        } else if (typeof fileOrUrl !== 'string' && fileOrUrl instanceof Blob) {
            url = URL.createObjectURL(fileOrUrl);
        }
        setPreviewImage(url);
        setPreviewTitle(title);
        setPreviewOpen(true);
    };

    const handleChange = (key, info) => {
        const file = info.fileList.length > 0 ? info.fileList[info.fileList.length - 1].originFileObj : null;
        if (file) {
            onChange?.({ ...value, [key]: file });
        }
    };

    const handleRemove = (key) => {
        const newValue = { ...value };
        delete newValue[key];
        onChange?.(newValue);
    };

    const renderSlot = (slot) => {
        const currentVal = value[slot.key];
        const isUrl = typeof currentVal === 'string';
        let imgUrl = currentVal ? (isUrl ? currentVal : URL.createObjectURL(currentVal)) : null;
        imgUrl = getImageUrl(imgUrl);

        const cardStyle = {
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: mode === 'edit' && !imgUrl ? '1px dashed #d9d9d9' : '1px solid #f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#fafafa',
            cursor: mode === 'edit' || imgUrl ? 'pointer' : 'default',
            transition: 'border-color 0.3s'
        };

        const imgStyle = {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
        };

        if (mode === 'view') {
            return (
                <div style={cardStyle} onClick={() => imgUrl && handlePreview(currentVal, slot.label)}>
                    {imgUrl ? (
                        <img src={imgUrl} alt={slot.label} style={imgStyle} />
                    ) : (
                        <div style={{ color: '#bfbfbf', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{slot.icon}</div>
                            <div style={{ fontSize: '12px' }}>No Image</div>
                        </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>
                        {slot.label}
                    </div>
                </div>
            );
        }

        return (
            <Upload
                listType="picture-card"
                showUploadList={false}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                onChange={(info) => handleChange(slot.key, info)}
                accept="image/*"
                style={{ width: '100%', height: '100%' }}
                className="vehicle-image-upload"
            >
                <div style={{ ...cardStyle, width: '100%', border: 'none', background: 'transparent' }} className="vehicle-image-card">
                    {imgUrl ? (
                        <>
                            <img src={imgUrl} alt={slot.label} style={imgStyle} className="vehicle-uploaded-img" />
                            <div className="vehicle-upload-actions" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: 16, opacity: 0, transition: 'opacity 0.3s', zIndex: 10 }}>
                                <EyeOutlined style={{ color: 'white', fontSize: 20 }} onClick={(e) => { e.stopPropagation(); handlePreview(currentVal, slot.label); }} />
                                <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 20 }} onClick={(e) => { e.stopPropagation(); handleRemove(slot.key); }} />
                            </div>
                        </>
                    ) : (
                        <div style={{ color: '#8c8c8c', textAlign: 'center', transition: 'color 0.3s' }} className="vehicle-upload-placeholder">
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{slot.icon}</div>
                            <div style={{ fontSize: '12px' }}>Upload</div>
                        </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: imgUrl ? 'rgba(0,0,0,0.6)' : '#f0f0f0', color: imgUrl ? 'white' : '#595959', padding: '4px 8px', fontSize: '12px', textAlign: 'center', transition: 'all 0.3s' }}>
                        {slot.label}
                    </div>
                </div>
            </Upload>
        );
    };

    return (
        <>
            <Row gutter={[16, 16]}>
                {IMAGE_SLOTS.map(slot => (
                    <Col xs={24} sm={12} key={slot.key}>
                        {renderSlot(slot)}
                    </Col>
                ))}
            </Row>
            <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)} centered>
                <img alt="preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>
            <style>{`
                .vehicle-image-upload .ant-upload-select-picture-card { width: 100% !important; height: 140px !important; margin: 0 !important; background: transparent !important; border-radius: 8px !important; }
                .vehicle-image-card:hover .vehicle-upload-actions { opacity: 1 !important; }
                .vehicle-image-card:hover .vehicle-uploaded-img { filter: brightness(0.6); }
                .vehicle-image-upload:hover .vehicle-upload-placeholder { color: #1890ff !important; }
            `}</style>
        </>
    );
};

export default VehicleImageGrid;
