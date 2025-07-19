import React, { useState, useEffect } from 'react';
import './style.css';

let globalFieldId = 0;

const generateFieldId = () => `field_${++globalFieldId}`;

const FieldRow = ({ field, onUpdate, onDelete, onAddNested, depth }) => {
  const handleKeyChange = (e) => {
    onUpdate(field.id, { key: e.target.value });
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    onUpdate(field.id, {
      type,
      children: type === 'nested' ? field.children || [] : [],
    });
  };

  return (
    <div className="field-row" data-depth={depth}>
      <div className="field-row__content">
        <div className="field-row__main">
          <div className="form-group">
            <label className="form-label">Field Name</label>
            <input
              type="text"
              className="form-control field-key"
              placeholder="Enter field name"
              value={field.key}
              onChange={handleKeyChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-control field-type"
              value={field.type}
              onChange={handleTypeChange}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="nested">Nested Object</option>
            </select>
          </div>
          <div className="field-row__actions">
            <button
              className="btn btn--outline btn--sm delete-field"
              onClick={() => onDelete(field.id)}
            >
              <span className="btn-icon">🗑️</span>
            </button>
          </div>
        </div>

        {field.type === 'nested' && (
          <>
            <div className="nested-actions">
              <button
                className="btn btn--secondary btn--sm add-nested-field"
                onClick={() => onAddNested(field.id)}
              >
                <span className="btn-icon">+</span>
                Add Nested Field
              </button>
            </div>
            <div className="nested-fields">
              {field.children?.map((child) => (
                <FieldRow
                  key={child.id}
                  field={child}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddNested={onAddNested}
                  depth={depth + 1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [fields, setFields] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');

  const addField = (parentId = null) => {
    const newField = {
      id: generateFieldId(),
      key: '',
      type: 'string',
      children: [],
    };

    if (!parentId) {
      setFields([...fields, newField]);
    } else {
      const updateFieldTree = (items) =>
        items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newField],
            };
          }
          if (item.children?.length) {
            return {
              ...item,
              children: updateFieldTree(item.children),
            };
          }
          return item;
        });

      setFields(updateFieldTree(fields));
    }
  };

  const updateField = (id, updates) => {
    const updateFieldTree = (items) =>
      items.map((item) => {
        if (item.id === id) {
          return { ...item, ...updates };
        }
        if (item.children?.length) {
          return { ...item, children: updateFieldTree(item.children) };
        }
        return item;
      });

    setFields(updateFieldTree(fields));
  };

  const deleteField = (id) => {
    const deleteFieldTree = (items) =>
      items
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          children: item.children ? deleteFieldTree(item.children) : [],
        }));

    setFields(deleteFieldTree(fields));
  };

  const transformToJsonSchema = (items) => {
    const schema = {
      type: 'object',
      properties: {},
    };

    items.forEach((field) => {
      if (field.key) {
        if (field.type === 'nested') {
          schema.properties[field.key] = transformToJsonSchema(field.children);
        } else {
          schema.properties[field.key] = {
            type: field.type,
            default: field.type === 'string' ? '' : 0,
          };
        }
      }
    });

    return schema;
  };

  const jsonPreview = JSON.stringify(transformToJsonSchema(fields), null, 2);

  return (
    <div className="container">
      <div className="py-16">
        <h1 className="mb-8">JSON Schema Builder</h1>

        <div className="tab-container mb-16">
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'builder' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('builder')}
            >
              Schema Builder
            </button>
            <button
              className={`tab-btn ${activeTab === 'json' ? 'tab-btn--active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              JSON Preview
            </button>
          </div>
        </div>

        {activeTab === 'builder' && (
          <div id="builder-tab" className="tab-content tab-content--active">
            <div className="card">
              <div className="card__body">
                <div className="flex justify-between items-center mb-16">
                  <h3>Schema Fields</h3>
                  <button
                    className="btn btn--primary"
                    onClick={() => addField(null)}
                  >
                    <span className="btn-icon">+</span>
                    Add Field
                  </button>
                </div>

                <div className="fields-container">
                  {fields.length === 0 ? (
                    <div className="empty-state">
                      <p className="text-secondary">No fields added yet. Click "Add Field" to get started.</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <FieldRow
                        key={field.id}
                        field={field}
                        onUpdate={updateField}
                        onDelete={deleteField}
                        onAddNested={addField}
                        depth={0}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div id="json-tab" className="tab-content tab-content--active">
            <div className="card">
              <div className="card__body">
                <h3 className="mb-16">Generated JSON Schema</h3>
                <div className="json-preview-container">
                  <pre className="json-preview">{jsonPreview}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;