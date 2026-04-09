export const SALES_CHANNELS = ['website', 'hotline', 'facebook', 'shopee'] as const;

export type SalesChannel = (typeof SALES_CHANNELS)[number];

const SALES_CHANNEL_PREFIX = '[[salesChannel:';
const SALES_CHANNEL_PATTERN = /^\[\[salesChannel:(website|hotline|facebook|shopee)\]\]\s*/i;

export function parseOrderCustomerNote(rawNote?: string | null) {
  const raw = rawNote?.trim() ?? '';
  const matched = raw.match(SALES_CHANNEL_PATTERN);
  const salesChannel = (matched?.[1]?.toLowerCase() as SalesChannel | undefined) ?? 'website';
  const customerNote = matched ? raw.slice(matched[0].length).trim() : raw;

  return {
    salesChannel,
    customerNote: customerNote || null,
  };
}

export function serializeOrderCustomerNote(customerNote?: string | null, salesChannel: SalesChannel = 'website') {
  const note = customerNote?.trim() ?? '';
  const prefix = `[[salesChannel:${salesChannel}]]`;

  return [prefix, note].filter(Boolean).join('\n').trim() || null;
}

export function decorateOrderRecord<T extends { note?: string | null }>(order: T) {
  const parsed = parseOrderCustomerNote(order.note);
  return {
    ...order,
    note: parsed.customerNote,
    salesChannel: parsed.salesChannel,
  };
}

export function getSalesChannelSearchFilter(salesChannel: SalesChannel) {
  if (salesChannel === 'website') {
    return {
      OR: [
        { note: { contains: `${SALES_CHANNEL_PREFIX}website]]`, mode: 'insensitive' as const } },
        { NOT: { note: { contains: SALES_CHANNEL_PREFIX, mode: 'insensitive' as const } } },
      ],
    };
  }

  return {
    note: { contains: `${SALES_CHANNEL_PREFIX}${salesChannel}]]`, mode: 'insensitive' as const },
  };
}
