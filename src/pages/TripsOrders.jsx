import React, { useState, useEffect } from "react";
import Orders from "./Orders";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useI18n } from "@/app/i18n.jsx";
import { useGetData } from "@/api/api";

function TripsOrders() {
  const { t } = useI18n();
  
  // Получаем данные пользователя для определения роли
  const { data: userData } = useGetData("/user");
  const userRole = userData?.role || "passenger";
  
  // Для водителей показываем табы "Все заказы" и "Мои заказы"
  // Для пассажиров показываем табы "Создать заказ" и "Мои заказы"
  const isDriver = userRole === "driver";
  
  // Устанавливаем начальный таб в зависимости от роли
  const [activeTab, setActiveTab] = useState(isDriver ? "all-orders" : "create");
  
  // Обновляем активный таб при изменении роли
  useEffect(() => {
    if (isDriver && activeTab === "create") {
      setActiveTab("all-orders");
    } else if (!isDriver && activeTab === "all-orders") {
      setActiveTab("create");
    }
  }, [isDriver, activeTab]);

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          {isDriver ? (
            <>
              <TabsTrigger value="all-orders" className="flex-1">
                Все заказы
              </TabsTrigger>
              <TabsTrigger value="my-orders" className="flex-1">
                Мои заказы
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="create" className="flex-1">
                Создать заказ
              </TabsTrigger>
              <TabsTrigger value="my-orders" className="flex-1">
                Мои заказы
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        {isDriver ? (
          <>
            <TabsContent value="all-orders" className="mt-0">
              <Orders showCreateOrder={false} showAllOrders={true} />
            </TabsContent>
            <TabsContent value="my-orders" className="mt-0">
              <Orders showCreateOrder={false} showAllOrders={false} />
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="create" className="mt-0">
              <Orders showCreateOrder={true} />
            </TabsContent>
            <TabsContent value="my-orders" className="mt-0">
              <Orders showCreateOrder={false} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default TripsOrders;

