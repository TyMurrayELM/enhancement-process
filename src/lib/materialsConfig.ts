import { Package, Truck, CheckCircle, Ban } from 'lucide-react';

export const materialsConfig = {
  need_to_order: {
    label: 'Need to Order',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: Package,
  },
  in_route: {
    label: 'In Route',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Truck,
  },
  received: {
    label: 'Received',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  not_needed: {
    label: 'Not Needed',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: Ban,
  },
};