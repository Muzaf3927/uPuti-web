import React, { useState } from "react";
import Orders from "./Orders";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useI18n } from "@/app/i18n.jsx";

function TripsOrders() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="create" className="flex-1">
            Создать заказ
          </TabsTrigger>
          <TabsTrigger value="my-orders" className="flex-1">
            Мои заказы
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-0">
          <Orders showCreateOrder={true} />
        </TabsContent>
        
        <TabsContent value="my-orders" className="mt-0">
          <Orders showCreateOrder={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TripsOrders;

