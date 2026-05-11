import type { TierItem } from "../lib/feedUi";

export interface MockRankCampaign {
  id: string;
  sponsorName: string;
  sponsorHandle: string;
  sponsorLogoText: string;
  tierListName: string;
  category: string;
  coverImage: string;
  objective: string;
  disclosure: string;
  rewardText: string;
  estimatedTime: string;
  itemFormat: "text" | "image";
  items: TierItem[];
  tags: string[];
  defaultCaption: string;
}

export const MOCK_RANK_CAMPAIGNS: MockRankCampaign[] = [
  {
    id: "bitelab-new-menu",
    sponsorName: "BiteLab Kitchen",
    sponsorHandle: "bitelabkitchen",
    sponsorLogoText: "BL",
    tierListName: "BiteLab New Menu Ranking",
    category: "food",
    coverImage:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900",
    objective: "Help BiteLab decide which new menu items should launch first.",
    disclosure: "Your ranking is used as aggregated menu preference research.",
    rewardText: "Menu research campaign",
    estimatedTime: "~1 min",
    itemFormat: "image",
    tags: ["food", "menuResearch", "sponsored", "bitelab"],
    defaultCaption: "My picks for BiteLab's next menu drop.",
    items: [
      {
        id: "campaign_bitelab_wings",
        name: "Spicy Chicken Wings",
        imageUrl:
          "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_truffle_fries",
        name: "Truffle Fries",
        imageUrl:
          "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_burger",
        name: "Classic Burger",
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_basil_chicken",
        name: "Thai Basil Chicken Bowl",
        imageUrl:
          "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_thai_tea",
        name: "Iced Thai Tea Float",
        imageUrl:
          "https://images.unsplash.com/photo-1556679343-c7306c1976bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_mango_shake",
        name: "Mango Sticky Rice Shake",
        imageUrl:
          "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_tom_yum_pasta",
        name: "Tom Yum Cream Pasta",
        imageUrl:
          "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_salmon_bowl",
        name: "Seared Salmon Rice Bowl",
        imageUrl:
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
      {
        id: "campaign_bitelab_matcha_cheesecake",
        name: "Matcha Basque Cheesecake",
        imageUrl:
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
      },
    ],
  },
];

export function getMockRankCampaign(campaignId?: string | null) {
  if (!campaignId) {
    return null;
  }
  return MOCK_RANK_CAMPAIGNS.find((campaign) => campaign.id === campaignId) ?? null;
}
