import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TypingTest = () => {
  const [text, setText] = useState('');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Type Flow Forge</h1>
          <p className="text-muted-foreground">Test your typing speed and accuracy</p>
        </div>

        <Card className="mx-auto max-w-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <p>Simple typing test interface</p>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-32 p-2 border rounded mt-4"
                placeholder="Start typing here..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
