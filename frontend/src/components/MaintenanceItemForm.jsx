import React, { useState } from 'react'
import Input from './Input'
import Select from './Select'
import TextArea from './TextArea'
import Button from './Button'
import './MaintenanceItemForm.css'

function MaintenanceItemForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    maintenance_type: 'mileage',
    frequency_value: '',
    frequency_unit: 'miles',
    notes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // When maintenance type changes, update default frequency unit
    if (name === 'maintenance_type') {
      setFormData(prev => ({
        ...prev,
        frequency_unit: value === 'mileage' ? 'miles' : 'months'
      }))
    }
  }

  const handleAdd = () => {
    // Validate required fields
    if (!formData.name || !formData.frequency_value) {
      return
    }

    onAdd({
      ...formData,
      frequency_value: parseInt(formData.frequency_value)
    })
    // Reset form
    setFormData({
      name: '',
      maintenance_type: 'mileage',
      frequency_value: '',
      frequency_unit: 'miles',
      notes: ''
    })
  }

  const maintenanceTypeOptions = [
    { value: 'mileage', label: 'Mileage-based' },
    { value: 'time', label: 'Time-based' }
  ]

  const frequencyUnitOptions = formData.maintenance_type === 'mileage'
    ? [{ value: 'miles', label: 'Miles' }]
    : [
        { value: 'days', label: 'Days' },
        { value: 'months', label: 'Months' },
        { value: 'years', label: 'Years' }
      ]

  return (
    <div className="maintenance-item-form">
      <div className="form-row">
        <Input
          label="Maintenance Item Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Oil Change, Tire Rotation"
          required
        />
      </div>

      <div className="form-row form-row-2col">
        <Select
          label="Type"
          name="maintenance_type"
          value={formData.maintenance_type}
          onChange={handleChange}
          options={maintenanceTypeOptions}
          required
        />

        <div className="frequency-inputs">
          <Input
            label="Frequency"
            name="frequency_value"
            type="number"
            value={formData.frequency_value}
            onChange={handleChange}
            placeholder="e.g., 5000"
            min="1"
            required
          />
          <Select
            label="Unit"
            name="frequency_unit"
            value={formData.frequency_unit}
            onChange={handleChange}
            options={frequencyUnitOptions}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <TextArea
          label="Notes (Optional)"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g., Part numbers, oil type, filter size..."
          rows={3}
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="primary" onClick={handleAdd}>
          Add Maintenance Item
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export default MaintenanceItemForm
