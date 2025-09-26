{
    "name": "Kv",
    "metadata": {
        "fields": [
            {
                "name": "id",
                "description": "The ID representing a Facebook Page.",
                "type": "numeric string"
            },
            {
                "name": "about",
                "description": "Information about the Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access). This value maps to the **Description** setting in the **Edit Page Info** user interface. Limit of 100 characters.",
                "type": "string"
            },
            {
                "name": "access_token",
                "description": "The Page's access token. Only returned if the User making the request has a role (other than Live Contributor) on the Page. If your business requires two-factor authentication, the User must also be authenticated",
                "type": "string"
            },
            {
                "name": "ad_campaign",
                "description": "The Page's currently running an ad campaign",
                "type": "adset"
            },
            {
                "name": "affiliation",
                "description": "Affiliation of this person. Applicable to Pages representing people. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "app_id",
                "description": "App ID for app-owned Pages and app Pages",
                "type": "id"
            },
            {
                "name": "artists_we_like",
                "description": "Artists the band likes. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "attire",
                "description": "Dress code of the business. Applicable to Restaurants or Nightlife. Can be one of Casual, Dressy or Unspecified. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "available_promo_offer_ids",
                "description": "available_promo_offer_ids",
                "type": "list<keyvalue:enum,list<keyvalue:string,string>>"
            },
            {
                "name": "awards",
                "description": "The awards information of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "band_interests",
                "description": "Band interests. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "band_members",
                "description": "Members of the band. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "best_page",
                "description": "The best available Page on Facebook for the concept represented by this Page. The best available Page takes into account authenticity and the number of likes",
                "type": "page"
            },
            {
                "name": "bio",
                "description": "Biography of the band. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access). Limit of 100 characters.",
                "type": "string"
            },
            {
                "name": "birthday",
                "description": "Birthday of this person. Applicable to Pages representing people. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "booking_agent",
                "description": "Booking agent of the band. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "built",
                "description": "Year vehicle was built. Applicable to Vehicles. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "business",
                "description": "The Business associated with this Page. Requires business_management permissions, and a page or user access token. The person requesting the access token must be an admin of the page."
            },
            {
                "name": "can_checkin",
                "description": "Whether the Page has checkin functionality enabled. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "can_post",
                "description": "Indicates whether the current app user can post on this Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "category",
                "description": "The Page's category. e.g. Product/Service, Computers/Technology. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "category_list",
                "description": "The Page's sub-categories. This field will not return the parent category.",
                "type": "list<pagecategory>"
            },
            {
                "name": "checkins",
                "description": "Number of checkins at a place represented by a Page",
                "type": "unsigned int32"
            },
            {
                "name": "company_overview",
                "description": "The company overview. Applicable to Companies. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "connected_instagram_account",
                "description": "Instagram account connected to page via page settings",
                "type": "iguser"
            },
            {
                "name": "connected_page_backed_instagram_account",
                "description": "Linked page backed instagram account for this page",
                "type": "iguser"
            },
            {
                "name": "contact_address",
                "description": "The mailing or contact address for this page. This field will be blank if the contact address is the same as the physical address",
                "type": "mailingaddress"
            },
            {
                "name": "copyright_attribution_insights",
                "description": "Insight metrics that measures performance of copyright attribution. An example metric would be number of incremental followers from attribution",
                "type": "copyrightattributioninsights"
            },
            {
                "name": "copyright_whitelisted_ig_partners",
                "description": "Instagram usernames who will not be reported in copyright match systems",
                "type": "list<string>"
            },
            {
                "name": "country_page_likes",
                "description": "If this is a Page in a Global Pages hierarchy, the number of people who are being directed to this Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "unsigned int32"
            },
            {
                "name": "cover",
                "description": "Information about the page's cover photo",
                "type": "coverphoto"
            },
            {
                "name": "culinary_team",
                "description": "Culinary team of the business. Applicable to Restaurants or Nightlife. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "current_location",
                "description": "Current location of the Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access). To manage a child Page's location use the [`/{page-id}/locations` endpoint](/docs/graph-api/reference/page/locations#updatepost).",
                "type": "string"
            },
            {
                "name": "delivery_and_pickup_option_info",
                "description": "A Vector of url strings for delivery_and_pickup_option_info of the Page.",
                "type": "list<string>"
            },
            {
                "name": "description",
                "description": "The description of the Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access). Note that this value is mapped to the **Additional Information** setting in the **Edit Page Info** user interface.",
                "type": "string"
            },
            {
                "name": "description_html",
                "description": "The description of the Page in raw HTML. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "differently_open_offerings",
                "description": "To be used when `temporary_status` is set to `differently_open` to indicate how the business is operating differently than usual, such as a restaurant offering takeout. Enum keys can be one or more of the following: ONLINE_SERVICES, DELIVERY, PICKUP, OTHER with the value set to `true` or `false`. For example, a business offering food pick up but pausing delivery would be `differently_open_offerings:{\"DELIVERY\":\"false\", \"PICKUP\":\"true\"}`",
                "type": "list<keyvalue:enum,bool>"
            },
            {
                "name": "directed_by",
                "description": "The director of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "display_subtext",
                "description": "Subtext about the Page being viewed. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "displayed_message_response_time",
                "description": "Page estimated message response time displayed to user. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "does_viewer_have_page_permission_link_ig",
                "description": "does_viewer_have_page_permission_link_ig",
                "type": "bool"
            },
            {
                "name": "emails",
                "description": "The emails listed in the About section of a Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "list<string>"
            },
            {
                "name": "engagement",
                "description": "The social sentence and like count information for this Page. This is the same info used for the like button",
                "type": "engagement"
            },
            {
                "name": "fan_count",
                "description": "The number of users who like the Page. For Global Pages this is the count for all Pages across the brand. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access). For [New Page Experience](https://developers.facebook.com/docs/pages/reference) Pages, this field will return `followers_count`.",
                "type": "unsigned int32"
            },
            {
                "name": "featured_video",
                "description": "Video featured by the Page",
                "type": "video"
            },
            {
                "name": "features",
                "description": "Features of the vehicle. Applicable to Vehicles. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "followers_count",
                "description": "Number of page followers ",
                "type": "unsigned int32"
            },
            {
                "name": "food_styles",
                "description": "The restaurant's food styles. Applicable to Restaurants",
                "type": "list<string>"
            },
            {
                "name": "founded",
                "description": "When the company was founded. Applicable to Pages in the Company category. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "general_info",
                "description": "General information provided by the Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "general_manager",
                "description": "General manager of the business. Applicable to Restaurants or Nightlife. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "genre",
                "description": "The genre of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "global_brand_page_name",
                "description": "The name of the Page with country codes appended for Global Pages. Only visible to the Page admin. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "global_brand_root_id",
                "description": "This brand's global Root ID",
                "type": "numeric string"
            },
            {
                "name": "has_added_app",
                "description": "Indicates whether this Page has added the app making the query in a Page tab. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS).",
                "type": "bool"
            },
            {
                "name": "has_lead_access",
                "description": "has_lead_access",
                "type": "hasleadaccess"
            },
            {
                "name": "has_transitioned_to_new_page_experience",
                "description": "indicates whether a page has transitioned to new page experience or not",
                "type": "bool"
            },
            {
                "name": "has_whatsapp_business_number",
                "description": "Indicates whether WhatsApp number connected to this page is a WhatsApp business number. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "has_whatsapp_number",
                "description": "Indicates whether WhatsApp number connected to this page is a WhatsApp number. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "hometown",
                "description": "Hometown of the band. Applicable to Bands",
                "type": "string"
            },
            {
                "name": "hours",
                "description": "Indicates a single range of opening hours for a day. Each day can have 2 different `hours` ranges. The keys in the map are in the form of `{day}_{number}_{status}`.  `{day}` should be the first 3 characters of the day of the week, `{number}` should be either 1 or 2 to allow for the two different hours ranges per day. `{status}` should be either `open` or `close` to delineate the start or end of a time range. \nAn example with: \n`{\n  \"hours\": {\n    \"mon_1_open\": \"09:00\",     //open at 9am on Monday\n    \"mon_1_close\": \"12:00\",    //close at 12pm\n    \"mon_2_open\": \"13:15\",    //open at 1:15pm\n    \"mon_2_close\": \"18:00\".    //close at 6pm\n  }`\n If one specific day is open 24 hours, the range should be specified as `00:00` to `24:00`. If the place is open 24/7, use the `is_always_open` field instead.\n**Note:** If a business is open during the night, the closing time can not pass 6:00am. For example, `\"mon_2_open\":\"13:15\"` and `\"mon_2_close\":\"5:59\"` will work however `\"mon_close_close\":\"6:00\"` will not.",
                "type": "map<string, string>"
            },
            {
                "name": "impressum",
                "description": "Legal information about the Page publishers. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "influences",
                "description": "Influences on the band. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "instagram_business_account",
                "description": "Instagram account linked to page during Instagram business conversion flow",
                "type": "iguser"
            },
            {
                "name": "is_always_open",
                "description": "Indicates whether this location is always open. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_calling_eligible",
                "description": "is_calling_eligible",
                "type": "bool"
            },
            {
                "name": "is_chain",
                "description": "Indicates whether location is part of a chain. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_community_page",
                "description": "Indicates whether the Page is a community Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_eligible_for_branded_content",
                "description": "Indicates whether the page is eligible for the branded content tool",
                "type": "bool"
            },
            {
                "name": "is_eligible_for_disable_connect_ig_btn_for_non_page_admin_am_web",
                "description": "is_eligible_for_disable_connect_ig_btn_for_non_page_admin_am_web",
                "type": "bool"
            },
            {
                "name": "is_messenger_bot_get_started_enabled",
                "description": "Indicates whether the page is a Messenger Platform Bot with Get Started button enabled",
                "type": "bool"
            },
            {
                "name": "is_messenger_platform_bot",
                "description": "Indicates whether the page is a Messenger Platform Bot. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_owned",
                "description": "Indicates whether Page is owned. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_permanently_closed",
                "description": "Whether the business corresponding to this Page is permanently closed. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "bool"
            },
            {
                "name": "is_published",
                "description": "Indicates whether the Page is published and visible to non-admins",
                "type": "bool"
            },
            {
                "name": "is_unclaimed",
                "description": "Indicates whether the Page is unclaimed",
                "type": "bool"
            },
            {
                "name": "is_webhooks_subscribed",
                "description": "Indicates whether the application is subscribed for real time updates from this page",
                "type": "bool"
            },
            {
                "name": "leadgen_tos_acceptance_time",
                "description": "Indicates the time when the TOS for running LeadGen Ads on the page was accepted",
                "type": "datetime"
            },
            {
                "name": "leadgen_tos_accepted",
                "description": "Indicates whether a user has accepted the TOS for running LeadGen Ads on the Page",
                "type": "bool"
            },
            {
                "name": "leadgen_tos_accepting_user",
                "description": "Indicates the user who accepted the TOS for running LeadGen Ads on the page",
                "type": "user"
            },
            {
                "name": "link",
                "description": "The Page's Facebook URL",
                "type": "string"
            },
            {
                "name": "location",
                "description": "The location of this place. Applicable to all Places",
                "type": "location"
            },
            {
                "name": "members",
                "description": "Members of this org. Applicable to Pages representing Team Orgs. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS).",
                "type": "string"
            },
            {
                "name": "merchant_id",
                "description": "The instant workflow merchant ID associated with the Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "merchant_review_status",
                "description": "Review status of the Page against FB commerce policies, this status decides whether the Page can use component flow",
                "type": "enum"
            },
            {
                "name": "messaging_feature_status",
                "description": "messaging_feature_status",
                "type": "messagingfeaturestatus"
            },
            {
                "name": "messenger_ads_default_icebreakers",
                "description": "The default ice breakers for a certain page",
                "type": "list<string>"
            },
            {
                "name": "messenger_ads_default_quick_replies",
                "description": "The default quick replies for a certain page",
                "type": "list<string>"
            },
            {
                "name": "messenger_ads_quick_replies_type",
                "description": "Indicates what type this page is and we will generate different sets of quick replies based on it. Values include `UNKNOWN`, `PAGE_SHOP`, or `RETAIL`.",
                "type": "enum"
            },
            {
                "name": "mission",
                "description": "The company mission. Applicable to Companies",
                "type": "string"
            },
            {
                "name": "mpg",
                "description": "MPG of the vehicle. Applicable to Vehicles. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "name",
                "description": "The name of the Page",
                "type": "string"
            },
            {
                "name": "name_with_location_descriptor",
                "description": "The name of the Page with its location and/or global brand descriptor. Only visible to a page admin. Non-page admins will get the same value as `name`.",
                "type": "string"
            },
            {
                "name": "network",
                "description": "The TV network for the TV show. Applicable to TV Shows. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "new_like_count",
                "description": "The number of people who have liked the Page, since the last login. Only visible to a Page admin. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "unsigned int32"
            },
            {
                "name": "offer_eligible",
                "description": "Offer eligibility status. Only visible to a page admin",
                "type": "bool"
            },
            {
                "name": "overall_star_rating",
                "description": "Overall page rating based on rating survey from users on a scale of 1-5. This value is normalized and is not guaranteed to be a strict average of user ratings. If there are 0 or a small number of ratings, this field will not be returned.",
                "type": "float"
            },
            {
                "name": "page_token",
                "description": "page token",
                "type": "string"
            },
            {
                "name": "parent_page",
                "description": "Parent Page of this Page. If the Page is part of a Global Root Structure and you have permission to the Global Root, the Global Root Parent Page is returned. If you do not have Global Root permission, the Market Page for your current region is returned as the Parent Page. If your Page is not part of a Global Root Structure, the Parent Page is returned.",
                "type": "page"
            },
            {
                "name": "parking",
                "description": "Parking information. Applicable to Businesses and Places",
                "type": "pageparking"
            },
            {
                "name": "payment_options",
                "description": "Payment options accepted by the business. Applicable to Restaurants or Nightlife",
                "type": "pagepaymentoptions"
            },
            {
                "name": "personal_info",
                "description": "Personal information. Applicable to Pages representing People. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS).",
                "type": "string"
            },
            {
                "name": "personal_interests",
                "description": "Personal interests. Applicable to Pages representing People. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "pharma_safety_info",
                "description": "Pharmacy safety information. Applicable to Pharmaceutical companies. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "phone",
                "description": "Phone number provided by a Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS).",
                "type": "string"
            },
            {
                "name": "pickup_options",
                "description": "List of pickup options available at this Page's store location. Values can include `CURBSIDE`, `IN_STORE`, and `OTHER`.",
                "type": "list<enum>"
            },
            {
                "name": "place_type",
                "description": "For places, the category of the place. Value can be `CITY`, `COUNTRY`, `EVENT`, `GEO_ENTITY`, `PLACE`, `RESIDENCE`, `STATE_PROVINCE`, or `TEXT`.",
                "type": "enum"
            },
            {
                "name": "plot_outline",
                "description": "The plot outline of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "preferred_audience",
                "description": "Group of tags describing the preferred audienceof ads created for the Page",
                "type": "targeting"
            },
            {
                "name": "press_contact",
                "description": "Press contact information of the band. Applicable to Bands",
                "type": "string"
            },
            {
                "name": "price_range",
                "description": "Price range of the business, such as a restaurant or salon. Values can be one of `$`, `$$`, `$$$`, `$$$$`, `Not Applicable`, or `null` if no value is set.. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "privacy_info_url",
                "description": "Privacy url in page info section",
                "type": "string"
            },
            {
                "name": "produced_by",
                "description": "The productor of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "products",
                "description": "The products of this company. Applicable to Companies",
                "type": "string"
            },
            {
                "name": "promotion_eligible",
                "description": "Boosted posts eligibility status. Only visible to a page admin",
                "type": "bool"
            },
            {
                "name": "promotion_ineligible_reason",
                "description": "Reason for which boosted posts are not eligible. Only visible to a page admin",
                "type": "string"
            },
            {
                "name": "public_transit",
                "description": "Public transit to the business. Applicable to Restaurants or Nightlife. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "rating_count",
                "description": "Number of ratings for the Page (limited to ratings that are publicly accessible). Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "unsigned int32"
            },
            {
                "name": "recipient",
                "description": "Messenger page scope id associated with page and a user using account_linking_token",
                "type": "numeric string"
            },
            {
                "name": "record_label",
                "description": "Record label of the band. Applicable to Bands. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "release_date",
                "description": "The film's release date. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "restaurant_services",
                "description": "Services the restaurant provides. Applicable to Restaurants",
                "type": "pagerestaurantservices"
            },
            {
                "name": "restaurant_specialties",
                "description": "The restaurant's specialties. Applicable to Restaurants",
                "type": "pagerestaurantspecialties"
            },
            {
                "name": "schedule",
                "description": "The air schedule of the TV show. Applicable to TV Shows. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "screenplay_by",
                "description": "The screenwriter of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "season",
                "description": "The season information of the TV Show. Applicable to TV Shows. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "single_line_address",
                "description": "The Page address, if any, in a simple single line format. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "starring",
                "description": "The cast of the film. Applicable to Films. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "start_info",
                "description": "Information about when the entity represented by the Page was started",
                "type": "pagestartinfo"
            },
            {
                "name": "store_code",
                "description": "Unique store code for this location Page. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "store_location_descriptor",
                "description": "Location Page's store location descriptor",
                "type": "string"
            },
            {
                "name": "store_number",
                "description": "Unique store number for this location Page",
                "type": "unsigned int32"
            },
            {
                "name": "studio",
                "description": "The studio for the film production. Applicable to Films",
                "type": "string"
            },
            {
                "name": "supports_donate_button_in_live_video",
                "description": "Whether the user can add a Donate Button to their Live Videos.",
                "type": "bool"
            },
            {
                "name": "talking_about_count",
                "description": "The number of people talking about this Page",
                "type": "unsigned int32"
            },
            {
                "name": "temporary_status",
                "description": "Indicates how the business corresponding to this Page is operating differently than usual. Possible values: \n\n* `differently_open`\n* `temporarily_closed`\n* `operating_as_usual`\n* `no_data`\n\nIf set to `differently_open` use with `differently_open_offerings` to set status.",
                "type": "enum"
            },
            {
                "name": "unread_message_count",
                "description": "Unread message count for the Page. Only visible to a page admin",
                "type": "unsigned int32"
            },
            {
                "name": "unread_notif_count",
                "description": "Number of unread notifications. Only visible to a page admin",
                "type": "unsigned int32"
            },
            {
                "name": "unseen_message_count",
                "description": "Unseen message count for the Page. Only visible to a page admin",
                "type": "unsigned int32"
            },
            {
                "name": "user_access_expire_time",
                "description": "user_access_expire_time",
                "type": "datetime"
            },
            {
                "name": "username",
                "description": "The alias of the Page. For example, for www.facebook.com/platform the username is 'platform'",
                "type": "string"
            },
            {
                "name": "verification_status",
                "description": "Showing whether this [Page is verified](https://www.facebook.com/help/1288173394636262). Value can be `blue_verified` or `gray_verified`, which represents that Facebook has confirmed that a Page is the authentic presence of the public figure, celebrity, or global brand it represents, or `not_verified`. This field can be read with the Page Public Metadata Access feature.",
                "type": "string"
            },
            {
                "name": "voip_info",
                "description": "Voip info",
                "type": "voipinfo"
            },
            {
                "name": "website",
                "description": "The URL of the Page's website. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "were_here_count",
                "description": "The number of visits to this Page's location. If the Page setting *Show map, check-ins and star ratings on the Page* (under *Page Settings* > *Page Info* > *Address*) is disabled, then this value will also be disabled. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "unsigned int32"
            },
            {
                "name": "whatsapp_number",
                "description": "The Page's WhatsApp number. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            },
            {
                "name": "written_by",
                "description": "The writer of the TV show. Applicable to TV Shows. Can be read with [Page Public Content Access](/docs/apps/review/feature/#reference-PAGES_ACCESS) or [Page Public Metadata Access](/docs/apps/review/feature#page-public-metadata-access).",
                "type": "string"
            }
        ],
        "type": "page",
        "connections": {
            "ab_tests": "https://graph.facebook.com/v23.0/687267067813915/ab_tests?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "ads_eligibility": "https://graph.facebook.com/v23.0/687267067813915/ads_eligibility?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "ads_posts": "https://graph.facebook.com/v23.0/687267067813915/ads_posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "agencies": "https://graph.facebook.com/v23.0/687267067813915/agencies?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "albums": "https://graph.facebook.com/v23.0/687267067813915/albums?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "ar_experience": "https://graph.facebook.com/v23.0/687267067813915/ar_experience?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "assigned_users": "https://graph.facebook.com/v23.0/687267067813915/assigned_users?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "audio_media_copyrights": "https://graph.facebook.com/v23.0/687267067813915/audio_media_copyrights?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "blocked": "https://graph.facebook.com/v23.0/687267067813915/blocked?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "businessprojects": "https://graph.facebook.com/v23.0/687267067813915/businessprojects?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "call_to_actions": "https://graph.facebook.com/v23.0/687267067813915/call_to_actions?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "canvas_elements": "https://graph.facebook.com/v23.0/687267067813915/canvas_elements?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "canvases": "https://graph.facebook.com/v23.0/687267067813915/canvases?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "chat_plugin": "https://graph.facebook.com/v23.0/687267067813915/chat_plugin?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "commerce_merchant_settings": "https://graph.facebook.com/v23.0/687267067813915/commerce_merchant_settings?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "commerce_orders": "https://graph.facebook.com/v23.0/687267067813915/commerce_orders?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "commerce_payouts": "https://graph.facebook.com/v23.0/687267067813915/commerce_payouts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "commerce_transactions": "https://graph.facebook.com/v23.0/687267067813915/commerce_transactions?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "conversations": "https://graph.facebook.com/v23.0/687267067813915/conversations?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "crosspost_whitelisted_pages": "https://graph.facebook.com/v23.0/687267067813915/crosspost_whitelisted_pages?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "ctx_optimization_eligibility": "https://graph.facebook.com/v23.0/687267067813915/ctx_optimization_eligibility?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "custom_labels": "https://graph.facebook.com/v23.0/687267067813915/custom_labels?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "custom_user_settings": "https://graph.facebook.com/v23.0/687267067813915/custom_user_settings?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "dataset": "https://graph.facebook.com/v23.0/687267067813915/dataset?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "events": "https://graph.facebook.com/v23.0/687267067813915/events?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "fantasy_games": "https://graph.facebook.com/v23.0/687267067813915/fantasy_games?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "feed": "https://graph.facebook.com/v23.0/687267067813915/feed?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "global_brand_children": "https://graph.facebook.com/v23.0/687267067813915/global_brand_children?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "image_copyrights": "https://graph.facebook.com/v23.0/687267067813915/image_copyrights?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "indexed_videos": "https://graph.facebook.com/v23.0/687267067813915/indexed_videos?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "insights": "https://graph.facebook.com/v23.0/687267067813915/insights?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "instagram_accounts": "https://graph.facebook.com/v23.0/687267067813915/instagram_accounts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "leadgen_forms": "https://graph.facebook.com/v23.0/687267067813915/leadgen_forms?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "likes": "https://graph.facebook.com/v23.0/687267067813915/likes?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "live_videos": "https://graph.facebook.com/v23.0/687267067813915/live_videos?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "locations": "https://graph.facebook.com/v23.0/687267067813915/locations?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "media_fingerprints": "https://graph.facebook.com/v23.0/687267067813915/media_fingerprints?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "message_templates": "https://graph.facebook.com/v23.0/687267067813915/message_templates?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "messaging_feature_review": "https://graph.facebook.com/v23.0/687267067813915/messaging_feature_review?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "messenger_call_settings": "https://graph.facebook.com/v23.0/687267067813915/messenger_call_settings?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "messenger_lead_forms": "https://graph.facebook.com/v23.0/687267067813915/messenger_lead_forms?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "messenger_profile": "https://graph.facebook.com/v23.0/687267067813915/messenger_profile?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "notification_message_tokens": "https://graph.facebook.com/v23.0/687267067813915/notification_message_tokens?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "page_backed_instagram_accounts": "https://graph.facebook.com/v23.0/687267067813915/page_backed_instagram_accounts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "personas": "https://graph.facebook.com/v23.0/687267067813915/personas?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "photos": "https://graph.facebook.com/v23.0/687267067813915/photos?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "picture": "https://graph.facebook.com/v23.0/687267067813915/picture?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "posts": "https://graph.facebook.com/v23.0/687267067813915/posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "product_catalogs": "https://graph.facebook.com/v23.0/687267067813915/product_catalogs?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "published_posts": "https://graph.facebook.com/v23.0/687267067813915/published_posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "ratings": "https://graph.facebook.com/v23.0/687267067813915/ratings?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "roles": "https://graph.facebook.com/v23.0/687267067813915/roles?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "rtb_dynamic_posts": "https://graph.facebook.com/v23.0/687267067813915/rtb_dynamic_posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "scheduled_posts": "https://graph.facebook.com/v23.0/687267067813915/scheduled_posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "secondary_receivers": "https://graph.facebook.com/v23.0/687267067813915/secondary_receivers?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "settings": "https://graph.facebook.com/v23.0/687267067813915/settings?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "shop_setup_status": "https://graph.facebook.com/v23.0/687267067813915/shop_setup_status?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "store_locations": "https://graph.facebook.com/v23.0/687267067813915/store_locations?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "stories": "https://graph.facebook.com/v23.0/687267067813915/stories?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "subscribed_apps": "https://graph.facebook.com/v23.0/687267067813915/subscribed_apps?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "tabs": "https://graph.facebook.com/v23.0/687267067813915/tabs?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "tagged": "https://graph.facebook.com/v23.0/687267067813915/tagged?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "thread_owner": "https://graph.facebook.com/v23.0/687267067813915/thread_owner?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "threads": "https://graph.facebook.com/v23.0/687267067813915/threads?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "video_copyright_rules": "https://graph.facebook.com/v23.0/687267067813915/video_copyright_rules?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "video_lists": "https://graph.facebook.com/v23.0/687267067813915/video_lists?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "video_reels": "https://graph.facebook.com/v23.0/687267067813915/video_reels?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "videos": "https://graph.facebook.com/v23.0/687267067813915/videos?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "visitor_posts": "https://graph.facebook.com/v23.0/687267067813915/visitor_posts?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD",
            "welcome_message_flows": "https://graph.facebook.com/v23.0/687267067813915/welcome_message_flows?access_token=EAATs0K01pOQBPuoIlZBZBF0wkZCiIfAQhDyrlcbZA77MeXWQXah6vFJEDqAnpKfYFqR9ueHr5AaJ14kwfsfgDzO1uUIFFXwAvrGsgjplX6Tun8G8lTL2uGQBg70TgXEgZC3tgzIZCdhSzwVoVtGvOSWhyjVw60aUMK9T1jhCO4tMttPrMWKzOc0j0y7dVvFFn7Ue9lZAvEQd5XPjjV9CNdfWzsidUYRcKPBcKjXoNAZAHOkZD"
        }
    },
    "id": "687267067813915"
}