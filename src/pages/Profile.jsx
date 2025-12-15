import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  CheckCircle2,
  CalendarDays,
  Copy,
  MessageCircle,
  Star,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Pencil,
  Car,
} from "lucide-react";
import { useGetData, useDeleteAccount, useUpdateProfile } from "@/api/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useI18n } from "@/app/i18n.jsx";
import AddCarModal from "@/components/AddCarModal";

function Profile() {
  const { t } = useI18n();
  const { data, isPending, error, refetch } = useGetData("/users/me");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "" });
  const [showCarModal, setShowCarModal] = useState(false);
  const deleteAccountMutation = useDeleteAccount();
  const updateProfileMutation = useUpdateProfile();
  
  const isDriver = data?.role === "driver";
  const car = data?.car;

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleEdit = () => {
    setEditData({
      name: data?.name || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(editData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ name: "" });
  };

  if (isPending)
    return (
      <Card className="max-w-md mx-auto w-full shadow-lg">
        <CardHeader className="flex items-center gap-4 pb-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="grid gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  if (error) return <div>{t("profilePage.errorLoading")}</div>;
  if (!data) return null;

  // const createdDate = new Date(data.created_at).toLocaleString();
  // const updatedDate = new Date(data.updated_at).toLocaleString();

  return (
    <>
      <Link
        to="/"
        className="flex items-center border rounded-2xl mb-5 w-40 p-1 bg-card/90 backdrop-blur-sm shadow"
      >
        <ArrowLeft />
        {t("profile.back")}
      </Link>
      <Card className="mx-auto w-full shadow-lg border rounded-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="flex items-center gap-3 pb-1">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow">
            <AvatarFallback className="uppercase text-xl">
              {getInitials(data.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900">
              <span className="truncate max-w-[140px] sm:max-w-none">{data.name || t("profilePage.none")}</span>
              {data.is_verified && (
                <Tooltip>
                  <TooltipTrigger>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent>{t("profilePage.verified")}</TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
          </div>
          {!isEditing ? (
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white/80 hover:bg-accent/60 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1"
              onClick={handleEdit}
              aria-label={t("profile.edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("profile.edit")}</span>
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto text-xs"
              >
                {t("profilePage.cancel")}
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto text-xs"
              >
                {updateProfileMutation.isPending ? t("profilePage.saving") : t("profilePage.save")}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="grid gap-3 pt-1">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("profilePage.nameLabel")}</Label>
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder={t("profilePage.namePlaceholder")}
                />
              </div>
            </div>
          ) : (
            <>
              {data.phone && (
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="whitespace-nowrap">{`+998${data.phone}`}</span>
                </div>
              )}
              {data?.rating !== undefined && (
                <div className="flex items-center gap-2 text-sm sm:text-base text-green-700">
                  <span>
                    <Star />
                  </span>
                  <span className="font-medium text-primary">{t("profile.rating")}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500 font-bold">{data?.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({data?.rating_count})
                    </span>
                  </span>
                </div>
              )}
              
              {/* Информация о машине для водителей */}
              {isDriver && (
                <div className="pt-3 border-t mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="text-sm sm:text-base font-semibold text-gray-900">
                        Информация о машине
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCarModal(true)}
                      className="text-xs px-2 py-1 h-7 flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Изменить</span>
                    </Button>
                  </div>
                  
                  {car ? (
                    <div className="space-y-2 text-sm">
                      {car.model && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Модель:</span>
                          <span className="text-gray-900">{car.model}</span>
                        </div>
                      )}
                      {car.color && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Цвет:</span>
                          <span className="text-gray-900">{car.color}</span>
                        </div>
                      )}
                      {car.number && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground min-w-[80px]">Номер:</span>
                          <span className="text-gray-900 font-semibold">{car.number}</span>
                        </div>
                      )}
                      {!car.model && !car.color && !car.number && (
                        <div className="text-sm text-muted-foreground">
                          Информация о машине не указана
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Информация о машине не указана
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Delete Account Button */}
          <div className="pt-3 border-t mt-3">
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full text-sm"
                  disabled={deleteAccountMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAccountMutation.isPending ? t("profilePage.deleting") : t("profilePage.deleteAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    {t("profilePage.confirmTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    {t("profilePage.confirmDescription")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {t("profilePage.cancel")}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? t("profilePage.deleting") : t("profilePage.confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Модальное окно для редактирования машины */}
      {showCarModal && (
        <AddCarModal
          userData={data}
          onCarAdded={async (carData) => {
            // Закрываем модальное окно в любом случае
            setShowCarModal(false);
            // Если данные сохранены (carData не null), обновляем профиль
            if (carData) {
              await refetch();
            }
          }}
        />
      )}
    </>
  );
}

export default Profile;
