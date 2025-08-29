const { generateAffiliateLink } = require('./path-to-your-utils');

describe('generateAffiliateLink', () => {
  it('should append Amazon tag correctly', () => {
    process.env.AMAZON_AFFILIATE_TAG = 'testtag';
    const url = 'https://www.amazon.com/dp/B08N5WRWNW';
    const result = generateAffiliateLink(url, 'amazon');
    expect(result).toContain('tag=testtag');
  });

  it('should return original URL if config is missing', () => {
    const url = 'https://example.com/product';
    const result = generateAffiliateLink(url, 'unknown');
    expect(result).toBe(url);
  });
});
