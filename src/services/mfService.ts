/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MFSearchResult {
  schemeCode: number;
  schemeName: string;
}

export interface MFDetails {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: {
    date: string;
    nav: string;
  }[];
}

export const mfService = {
  async searchFunds(query: string): Promise<MFSearchResult[]> {
    if (!query || query.length < 3) return [];
    try {
      const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      return await response.ok ? response.json() : [];
    } catch (error) {
      console.error("MF Search error:", error);
      return [];
    }
  },

  async getLatestNAV(schemeCode: string): Promise<{ nav: number; date: string } | null> {
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (!response.ok) throw new Error("Fetch NAV failed");
      const result: MFDetails = await response.json();
      if (result.data && result.data.length > 0) {
        return {
          nav: parseFloat(result.data[0].nav),
          date: result.data[0].date
        };
      }
      return null;
    } catch (error) {
      console.error("NAV Fetch error:", error);
      return null;
    }
  },

  async getHistoricalNAV(schemeCode: string, date: string): Promise<{ nav: number; date: string } | null> {
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (!response.ok) throw new Error("Fetch Historical NAV failed");
      const result: MFDetails = await response.json();
      
      // format: DD-MM-YYYY in API, input is YYYY-MM-DD
      const targetDate = new Date(date);
      const targetStr = `${String(targetDate.getDate()).padStart(2, '0')}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${targetDate.getFullYear()}`;
      
      // Try exact match or the closest one before the date (market holidays)
      const data = result.data;
      const found = data.find(d => d.date === targetStr) || data.find(d => {
        const dParts = d.date.split('-');
        const dDate = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}`);
        return dDate <= targetDate;
      });

      return found ? { nav: parseFloat(found.nav), date: found.date } : null;
    } catch (error) {
      console.error("Historical NAV Fetch error:", error);
      return null;
    }
  }
};
