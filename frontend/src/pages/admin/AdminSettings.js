import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { API_URL } from '../../lib/utils';
import { toast } from 'sonner';

const presetThemes = [
  { name: 'Default', primary: '#050505', accent: '#CCFF00', secondary: '#FFFFFF' },
  { name: 'Ocean Blue', primary: '#0f172a', accent: '#38bdf8', secondary: '#f8fafc' },
  { name: 'Forest Green', primary: '#14532d', accent: '#22c55e', secondary: '#f0fdf4' },
  { name: 'Royal Purple', primary: '#1e1b4b', accent: '#a855f7', secondary: '#faf5ff' },
  { name: 'Sunset Orange', primary: '#1c1917', accent: '#f97316', secondary: '#fff7ed' },
  { name: 'Ruby Red', primary: '#450a0a', accent: '#ef4444', secondary: '#fef2f2' },
];

const AdminSettings = () => {
  const [theme, setTheme] = useState({
    primary_color: '#050505',
    accent_color: '#CCFF00',
    secondary_color: '#FFFFFF',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/settings/theme`);
      setTheme(response.data);
    } catch (error) {
      console.error('Failed to fetch theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/admin/settings/theme`, theme);
      toast.success('Theme settings saved!');
      // Apply theme to document
      document.documentElement.style.setProperty('--admin-primary', theme.primary_color);
      document.documentElement.style.setProperty('--admin-accent', theme.accent_color);
    } catch (error) {
      toast.error('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setTheme({
      primary_color: preset.primary,
      accent_color: preset.accent,
      secondary_color: preset.secondary,
    });
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl">
        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
          data-testid="theme-settings"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#CCFF00] rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#050505]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Theme Customization</h2>
              <p className="text-sm text-neutral-500">Customize your admin dashboard colors</p>
            </div>
          </div>

          {/* Preset Themes */}
          <div className="mb-8">
            <Label className="mb-3 block">Preset Themes</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {presetThemes.map((preset) => {
                const isActive = 
                  theme.primary_color === preset.primary && 
                  theme.accent_color === preset.accent;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      isActive ? 'border-2 border-[#050505]' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                    data-testid={`theme-preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: preset.accent }}
                      />
                      {isActive && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                    </div>
                    <p className="text-sm font-medium">{preset.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">Custom Colors</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="primary"
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.primary_color}
                    onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                    className="flex-1 font-mono"
                    data-testid="primary-color-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="accent"
                    type="color"
                    value={theme.accent_color}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.accent_color}
                    onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                    className="flex-1 font-mono"
                    data-testid="accent-color-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secondary"
                    type="color"
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                    className="flex-1 font-mono"
                    data-testid="secondary-color-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-8">
            <Label className="mb-3 block">Preview</Label>
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: theme.primary_color }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-bold">GS PREMIER ADMIN</span>
                <span
                  className="px-3 py-1 rounded text-sm font-semibold"
                  style={{ backgroundColor: theme.accent_color, color: theme.primary_color }}
                >
                  Active
                </span>
              </div>
              <div
                className="p-4 rounded"
                style={{ backgroundColor: theme.secondary_color }}
              >
                <p style={{ color: theme.primary_color }}>Sample content area</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#050505] hover:bg-[#1a1a1a] text-white"
            data-testid="save-theme-btn"
          >
            {saving ? 'Saving...' : 'Save Theme Settings'}
          </Button>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
