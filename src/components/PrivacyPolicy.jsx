export default function PrivacyPolicy() {
    return (
        <div className="privacy-page">
            <header className="privacy-header">
                <div className="logo">
                    <img src="/logo.png" alt="UPuti" />
                    <span className="logo__text">UPuti</span>
                </div>
            </header>

            <main className="privacy-content">
                <div className="privacy-text">
                    <p>Developer Information</p>
                    <p>Developer: UMD GROUP</p>
                    <p>Google Play Developer ID: 5990176084226389760</p>
                    <p>Privacy Policy for UPuti</p>
                    <p>UPuti March 09, 2026</p>
                    <p>Effective Date: March 9, 2026</p>
                    <p>
                        UPuti is committed to protecting your privacy. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use our mobile application. By using the App,
                        you agree to the collection and use of information in accordance with this policy.
                    </p>
                    <p>1. Information Collection and Use</p>
                    <p>To provide a seamless carpooling experience between drivers and passengers, we collect the following types of information:</p>
                    <p>Personal Data: Name, phone number, and profile information provided during registration.</p>
                    <p>
                        Precise Geolocation Data: We use Mapbox and Google Maps services. The App collects precise and approximate location data
                        to enable ride-matching, route navigation, and to show nearby drivers or passengers. This data may be collected even when
                        the app is in the background if required for active trip tracking.
                    </p>
                    <p>
                        Device Information: We collect information about your mobile device, including device model, operating system version,
                        and unique device identifiers.
                    </p>
                    <p>
                        Storage and Cache: Using Shared Preferences, we store your session tokens and application preferences (such as language
                        settings via Easy Localization) locally on your device for a better user experience.
                    </p>
                    <p>2. Technical Permissions</p>
                    <p>Based on the App&apos;s configuration, we require the following permissions:</p>
                    <p>Location Permissions: Required to determine pickup/drop-off points and provide real-time navigation.</p>
                    <p>
                        Phone &amp; SMS: Required to allow drivers and passengers to communicate via calls or messages regarding trip details
                        (via url_launcher).
                    </p>
                    <p>Internet Access: Required for the App to communicate with our servers using the Dio networking library.</p>
                    <p>3. How We Use Your Information</p>
                    <p>The information we collect is used for:</p>
                    <p>Facilitating connections between drivers and passengers.</p>
                    <p>Real-time navigation and route optimization.</p>
                    <p>Processing and verifying user accounts to ensure community safety.</p>
                    <p>Sending transactional notifications regarding your rides.</p>
                    <p>4. Third-Party Services and Data Sharing</p>
                    <p>We do not sell your personal data. We share information with third parties only in the following circumstances:</p>
                    <p>
                        Map &amp; Navigation Providers: Location data is shared with Mapbox and Google Maps to render maps and calculate routes.
                    </p>
                    <p>
                        Ride Participants: Your name and phone number are shared with the specific driver or passenger you are matched with for a trip.
                    </p>
                    <p>
                        Legal Requirements: We may disclose your information if required by law or in response to valid requests by public authorities.
                    </p>
                    <p>5. Data Security</p>
                    <p>
                        We implement industry-standard security measures, including HTTPS/TLS encryption for all data transmitted via the Dio client,
                        to protect your personal information from unauthorized access, loss, or misuse.
                    </p>
                    <p>6. Data Retention and Deletion</p>
                    <p>
                        You have the right to access, update, or delete your personal information. If you wish to delete your account and all associated
                        data, you may do so through the &quot;Delete Account&quot; option within the App settings or by contacting our support team.
                    </p>
                    <p>7. Children&apos;s Privacy</p>
                    <p>
                        Our services are not intended for use by children under the age of 13. We do not knowingly collect personal information from children.
                    </p>
                    <p>8. Changes to This Privacy Policy</p>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page
                        and updating the &quot;Effective Date&quot; at the top.
                    </p>
                    <p>9. Contact Us</p>
                    <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us:</p>
                    <p>Telegram: @uputi_support</p>
                    <p>Report content on this page</p>
                </div>
            </main>
        </div>
    );
}
