import { useNavigate } from '@tanstack/react-router';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Calendar, Plus, Edit, X, CheckCheck } from 'lucide-react';
import { formatDateTime } from '../../lib/time';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, markAsRead, dismissNotification, dismissAll } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    navigate({ to: '/parties/$partyId', params: { partyId: notification.partyId } });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'new':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No notifications</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={dismissAll} className="h-8 text-xs">
            <CheckCheck className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-96">
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-accent/50 transition-colors ${
                !notification.isRead ? 'bg-accent/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="text-left w-full"
                  >
                    <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                    {notification.partyName && (
                      <p className="text-xs text-muted-foreground mt-1">{notification.partyName}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(BigInt(notification.timestamp * 1000000))}
                    </p>
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
