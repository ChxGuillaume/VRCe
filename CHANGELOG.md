# 1.5.7

Added:
- New traveling world status when needed
- Manual note added by user in user details

# 1.5.6

Fix:
- Mistake in manifest.json (since when? good question...)

# 1.5.5

Fix:
- Rollback some changes in background script (were not logging events)

# 1.5.4

Added:
- Supporter/Early Adopter badges on user details

Fix:
- Sometimes were not able to see any friends in friends/worlds tabs
- Global Fixes

# 1.5.3

Added:
- VRChat Homme connection status (Notify when offline / Click to connect)

Update:
- Improved search UX in friends list
- Button in settings to clear events

Fix:
- Missing Invite Request Response notification type (was showing "Not Set?")
- Changed Events fetching method to use the VRC Home URI

# 1.5.2

Added:
- Friend can now be favorited
- Get notified on favorited friends online

Update:
- Made Popup VCards size dynamic (Mostly for Mobile users of the Extension)
- Remade of the Moderation page UI
- Remade UI of Friends Tab
- Disable Gallery tab for Non VRCPlus Users

# 1.5.1

Fix:
- Picture Override now sets avatar picture to default (now displaying Picture Override when existing)
- Gallery active Icon/Picture fixed

# 1.5.0

Added:
- Notification for VRC Notifications (Invite, Invite Request, Reply, Friend Request)

Update:
- No friends online in WorldsTab
- Extend private in WorldsTab when nobody in other

Fix:
- No invite button on private instance
- User Update event in EventsTab was not working properly

# 1.4.5

Added:
- Invite to instance in WorldsTab
- Tooltips on WorldsTab buttons

Update:
- New Logo

Fix:
- Standalone Cloudflare dialog now go away on button click

# 1.4.4

Update:
- Invite to instance in FriendsTab
- Huge optimization on events Tab (Working on data when received instead of on show)
- Renaming extension for more public audience

Fix:
- Cloudflare message on Standalone
- Monkey VRChat that tells Active user are Online

# 1.4.1

Fix:
- FriendsTab item height
- Cloudflare message on Standalone

# 1.4.0

Added:
- Pagination for events in EventsTab
- Loader for some images
- Friend/User Update difference in events
- Collapse icons/pictures in GalleryTab
- Collapse world in WorldsTab
- Delete icons/pictures in GalleryTab
- Cloudflare 503 message, ask to visit VRChat website
- User details on self
- Worlds tab user details
- World type/region in WorldsTab and User Details

Update:
- Delete events older than 24h
- No spam on websocket retry
- Stop adding errors to IndexedDB events
- LoggedIn forwarded in PlayerModerationTab
- Format numbers in User Details drawer
- Warning when selecting events as default tab (still need optimization)

Fix:
- Some optimization in EventsTab
- Fix icon font
- Date warning when date is 'none' when fetching world

# 1.3.0
First version of VRCe on Firefox.

# < 1.3.0
No Changelog
