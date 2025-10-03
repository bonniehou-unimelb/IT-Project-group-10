import { Card, CardContent } from '../components/card';

export default function systemAdminStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

      <Card><CardContent>My Templates: {data.myTemplates}</CardContent></Card>

    </div>
  );
}
