'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { insertTestUsers, insertTestUsersWithCount } from '@/utils/testData';

export default function TestDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [maleCount, setMaleCount] = useState(2);
  const [femaleCount, setFemaleCount] = useState(2);

  const handleInsertAll = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const results = await insertTestUsers();
      setResult(`✅ Successfully created ${results.length} test users and registrations!`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertCustom = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const results = await insertTestUsersWithCount(maleCount, femaleCount);
      setResult(`✅ Successfully created ${results.length} test users (${maleCount} male, ${femaleCount} female)!`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Data Generator</CardTitle>
            <p className="text-sm text-gray-600">
              Insert test users without Kakao ID for development and testing
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Insert All Test Users */}
            <div className="space-y-3">
              <h3 className="font-medium">Insert All Test Users</h3>
              <p className="text-sm text-gray-600">
                Inserts 10 predefined test users (5 male, 5 female) with completed registrations
              </p>
              <Button
                onClick={handleInsertAll}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Insert All Test Users (10 users)'}
              </Button>
            </div>

            <div className="border-t pt-6" />

            {/* Custom Count */}
            <div className="space-y-3">
              <h3 className="font-medium">Insert Custom Count</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="male">Male Users</Label>
                  <Input
                    id="male"
                    type="number"
                    min="0"
                    max="5"
                    value={maleCount}
                    onChange={(e) => setMaleCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="female">Female Users</Label>
                  <Input
                    id="female"
                    type="number"
                    min="0"
                    max="5"
                    value={femaleCount}
                    onChange={(e) => setFemaleCount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <Button
                onClick={handleInsertCustom}
                disabled={isLoading || (maleCount === 0 && femaleCount === 0)}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Creating...' : `Insert ${maleCount + femaleCount} Users`}
              </Button>
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

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
              <p className="font-medium mb-2">ℹ️ What this does:</p>
              <ul className="space-y-1 text-xs">
                <li>• Creates users in the `users` collection (without kakaoId)</li>
                <li>• Creates completed registrations in `registrations` collection</li>
                <li>• Updates event participant counts in `events` collection</li>
                <li>• Uses realistic Korean names and phone numbers</li>
                <li>• Ages range from 23-29 years old</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}