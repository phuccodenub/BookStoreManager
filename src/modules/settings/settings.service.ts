import { env } from '../../shared/config/index.js';
import { prisma } from '../../shared/prisma/index.js';

const DEFAULT_CONFIG_ID = 'default';

function fallbackSettings() {
  return {
    id: DEFAULT_CONFIG_ID,
    storeName: 'BookStoreManager',
    contactEmail: 'support@bookstore.local',
    contactPhone: null,
    contactAddress: null,
    shippingFee: env.DEFAULT_SHIPPING_FEE,
    supportHours: null,
    paymentProviderName: 'Mock Gateway',
    paymentInstructions: 'Online payments are simulated through the protected mock webhook.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getPublicSettings() {
  const config = await prisma.systemConfig.findUnique({ where: { id: DEFAULT_CONFIG_ID } });
  return config ?? fallbackSettings();
}

export async function updateSettings(data: {
  storeName?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  shippingFee?: number;
  supportHours?: string | null;
  paymentProviderName?: string | null;
  paymentInstructions?: string | null;
}) {
  const defaults = fallbackSettings();

  return prisma.systemConfig.upsert({
    where: { id: DEFAULT_CONFIG_ID },
    update: data,
    create: {
      id: DEFAULT_CONFIG_ID,
      storeName: data.storeName ?? defaults.storeName,
      contactEmail: data.contactEmail ?? defaults.contactEmail,
      contactPhone: data.contactPhone ?? defaults.contactPhone,
      contactAddress: data.contactAddress ?? defaults.contactAddress,
      shippingFee: data.shippingFee ?? defaults.shippingFee,
      supportHours: data.supportHours ?? defaults.supportHours,
      paymentProviderName: data.paymentProviderName ?? defaults.paymentProviderName,
      paymentInstructions: data.paymentInstructions ?? defaults.paymentInstructions,
    },
  });
}
