'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { seedMenuItems } from '@/utils/seedMenu';
import { createMenuItem, getMenuItems } from '@/lib/firestore';
import { MenuItem } from '@/types';

export default function MenuAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [newItemName, setNewItemName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const handleSeedMenu = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const results = await seedMenuItems();
      setResult(`✅ Successfully created ${results.length} menu items!`);
      await loadMenuItems();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newItemName.trim()) return;

    setIsLoading(true);
    setResult('');

    try {
      await createMenuItem(newItemName.trim());
      setResult(`✅ Successfully created menu item: ${newItemName}`);
      setNewItemName('');
      await loadMenuItems();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const handleLoadMenuItems = async () => {
    setIsLoading(true);
    await loadMenuItems();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🍽️ Menu Management</CardTitle>
            <p className="text-sm text-gray-600">
              Manage bar menu items for the dashboard
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seed Menu */}
            <div className="space-y-3">
              <h3 className="font-medium">Seed Default Menu Items</h3>
              <p className="text-sm text-gray-600">
                Add 8 default Korean bar menu items (생맥주, 소주, 와인, 칵테일, etc.)
              </p>
              <Button
                onClick={handleSeedMenu}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Seed Menu Items'}
              </Button>
            </div>

            <div className="border-t pt-6" />

            {/* Add Single Item */}
            <div className="space-y-3">
              <h3 className="font-medium">Add Single Menu Item</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="itemName">Menu Item Name</Label>
                  <Input
                    id="itemName"
                    type="text"
                    placeholder="예: 막걸리"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddMenuItem}
                  disabled={isLoading || !newItemName.trim()}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? 'Adding...' : 'Add Menu Item'}
                </Button>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* View Current Menu */}
            <div className="space-y-3">
              <h3 className="font-medium">Current Menu Items</h3>
              <Button
                onClick={handleLoadMenuItems}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Load Current Menu'}
              </Button>

              {menuItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4 p-4 bg-gray-50 rounded-md">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded p-2 text-center text-sm border"
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-md text-sm ${
                result.startsWith('✅')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {result}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}