<?
$MESS["SEC_OTP_ACCESS_DENIED"] = "You cannot edit parameters of one-time passwords.";
$MESS["SEC_OTP_SWITCH_ON"] = "Enable Compound Passwords";
$MESS["SEC_OTP_SECRET_KEY"] = "Secret Key (supplied with the device)";
$MESS["SEC_OTP_INIT"] = "Initialization";
$MESS["SEC_OTP_PASS1"] = "The first device password (click and write down)";
$MESS["SEC_OTP_PASS2"] = "The second device password (click again and write down)";
$MESS["SEC_OTP_NOTE"] = "<h3 style=\"clear:both\"><br>One-Time Password</h3>
<img src=\"/bitrix/images/security/etoken_pass.png\" align=\"left\" style=\"margin-right:10px;\">
The <a href=\"http://en.wikipedia.org/wiki/One-time_password\">one-time password</a> (<b>OTP</b>) concept empowers the standard authorization scheme and significantly reinforces the web project security. The one-time password system requires a physical hardware token (device) (e.g., <a href=\"http://www.safenet-inc.com/products/data-protection/two-factor-authentication/etoken-pass/\">SafeNet eToken PASS</a>) or special OTP software. The site administrator is strongly recommended to use OTP to ensure the best security.
<h3 style=\"clear:both\"><br>Usage</h3>
<img src=\"/bitrix/images/security/en_pass_form.png\" align=\"left\" style=\"margin-right:10px;\">
If the OTP system is enabled, a user can authorize with a login and a compound password that consists of a standard password and a one-time device password (6 digits). The one-time password (see <font style=\"color:red\">2</font> on the figure) is entered in the \"Password\" field together with the standard password (see <font style=\"color:red\">1</font> on the figure) without space, in the authorization form.<br>
The OTP authentication takes effect after the secret key and <b>consecutively generated one-time passwords</b> obtained from the device are entered.
<h3 style=\"clear:both\"><br>Initialization</h3>
When initializing or repeatedly synchronizing the device, you will have to provide the two <b>consecutively generated one-time passwords</b> obtained from the device.
<h3 style=\"clear:both\"><br>Description</h3>
The OTP authorization system was developed by the Initiative for Open Authentication (<a href=\"http://www.openauthentication.org/\">OATH</a>).<br>
The implementation is based on the HMAC algorithm and the SHA-1 hash function. To calculate the OTP value, the system takes the two parameters on input: the secret key (initial value for the generator) and the counter current value (the required cycles of generation). Upon initialization of the device, the initial value is stored in the device as well as on the site. The device counter increments each time a new OTP is generated, the server counter - upon each successful OTP authentication.<br>
Each lot of OTP devices is shipped with an encrypted file containing the initial values (secret keys) for all devices in a lot. The values are bound to the device serial numbers printed on the device body.<br>
If the device and the server generator counters become desynchronized, you can easily resynchronize them by resetting the server value to the value stored in the device. This procedure requires that a system administrator (or a user owning sufficient permissions) generates two consequent OTP values and enters them in the OTP form.";
$MESS["SEC_OTP_TYPE"] = "Password generation algorithm";
$MESS["SEC_OTP_STATUS"] = "Current status";
$MESS["SEC_OTP_STATUS_ON"] = "Enabled";
$MESS["SEC_OTP_NEW_ACCESS_DENIED"] = "Access to two-step authentication control was denied.";
$MESS["SEC_OTP_NEW_SWITCH_ON"] = "Enable two-step authentication";
$MESS["SEC_OTP_DESCRIPTION_INTRO_TITLE"] = "One-time password";
$MESS["SEC_OTP_DESCRIPTION_INTRO_SITE"] = "Today, a user is using a pair of login and password to authenticate on your site. However, there are tools a malicious person
can employ to get into a computer and steal these data, for example if a user saves their password.<br>
<b>Two-step authentication</b> is the recommended option to protect against hacker software. Every time a user logs in to the system, they will have to pass two levels of verification. First, enter the login and password. Then, enter a one-time security code sent to their mobile device. The bottom line is an attacker cannot make use of the stolen data because they don't know the security code.";
$MESS["SEC_OTP_DESCRIPTION_INTRO_INTRANET"] = "Today, a user is using a pair of login and password to authenticate on your Bitrix24. However, there are tools a malicious person
can employ to get into a computer and steal these data, for example if a user saves their password.<br>
<b>Two-step authentication</b> is the recommended option to protect your Bitrix24 against hacker software. Every time a user logs in to the system, they will have to pass two levels of verification. First, enter the login and password. Then, enter a one-time security code sent to their mobile device. The bottom line is an attacker cannot make use of the stolen data because they don't know the security code.";
$MESS["SEC_OTP_DESCRIPTION_USING_TITLE"] = "Using One Time Passwords";
$MESS["SEC_OTP_DESCRIPTION_USING_STEP_0"] = "Step 1";
$MESS["SEC_OTP_DESCRIPTION_USING_STEP_1"] = "Step 2";
$MESS["SEC_OTP_DESCRIPTION_USING"] = "When two-step authentication is enabled, a user will have to pass two levels of verification when logging on. <br>
First, enter their e-mail and password as usual. <br>
Then, enter a one-time security code sent to their mobile device or obtained using a dedicated dongle.";
$MESS["SEC_OTP_DESCRIPTION_ACTIVATION_TITLE"] = "Activation";
$MESS["SEC_OTP_DESCRIPTION_ACTIVATION"] = "A one-time code for two-step authentication can be obtained by using a special device (a dongle), or a free mobile application (Bitrix OTP) each user needs to have installed on their mobile devices.<br>
To enable a dongle, the administrator will have to open the user's profile and enter the two passwords generated by the.<br>
To get a one-time code on a mobile device, a user can download and run the app, and scan the QR code on the settings page in their user profile or enter the account data manually.";
$MESS["SEC_OTP_DESCRIPTION_ABOUT_TITLE"] = "Description";
$MESS["SEC_OTP_DESCRIPTION_ABOUT"] = "One-Time Password (OTP) was developed as part of the OATH initiative.<br>
OTP is based on HMAC and SHA-1/SHA-256/SHA-512. At present, the two algorithms are supported to generate codes:
<ul><li>counter based(HMAC-Based One-time Password, HOTP) as described in <a href=\"https://tools.ietf.org/html/rfc4226\" target=\"_blank\">RFC4226</a></li>
<li>time based (Time-based One-time Password, TOTP) as described in <a href=\"https://tools.ietf.org/html/rfc6238\" target=\"_blank\">RFC6238</a></li></ul>
To calculate the OTP value the algorithm takes two input parameters: a secret key (initial value) and a current counter value (the number of required cycles of generation or a current time depending on the algorithm). The initial value is saved in the device as well as on the website once a device has been initialized. If using HOTP, the device counter is incremented on every OTP generation, while the server counter is changed on every successful OTP authentication. If using TOTP, no counter is saved in the device, and the server keeps track of the possible time change of the device on every successful OTP authentication.<br>
Each of the OTP devices in a batch includes an encrypted file containing the initial values (secret keys) for each device in the batch, the file is bound to the device serial number that can be found on the device.<br>
If the device and server counters grow out of sync, they can be easily synchronized back by bringing the server value to that of the device. To do so, the administrator (or a user with appropriate permission) has to generate two consecutive OTP's and enter them on the website.<br>
You can find the mobile app on AppStore and GooglePlay.";
$MESS["SEC_OTP_CONNECT_MOBILE_TITLE"] = "Connect mobile device";
$MESS["SEC_OTP_CONNECT_MOBILE_STEP_1"] = "Download the Bitrix OTP mobile app for your phone on <a href=\"https://itunes.apple.com/en/app/bitrix24-otp/id929604673?l=en\" target=\"_new\">AppStore</a> on <a href=\"https://play.google.com/store/apps/details?id=com.bitrixsoft.otp\" target=\"_new\">GooglePlay</a>";
$MESS["SEC_OTP_CONNECT_MOBILE_STEP_2"] = "Run the application and click <b>Configure</b>";
$MESS["SEC_OTP_CONNECT_MOBILE_STEP_3"] = "Choose how you want to enter data: using QR code or manually";
$MESS["SEC_OTP_CONNECT_MOBILE_SCAN_QR"] = "Bring your mobile device to the monitor and wait while the application is scanning the code.";
$MESS["SEC_OTP_CONNECT_MOBILE_MANUAL_INPUT"] = "To enter data manually, specify the website address, your e-mail or login, a secret code on the picture and select the key type.";
$MESS["SEC_OTP_CONNECT_MOBILE_MANUAL_INPUT_HOTP"] = "counter based";
$MESS["SEC_OTP_CONNECT_MOBILE_MANUAL_INPUT_TOTP"] = "time based";
$MESS["SEC_OTP_CONNECT_MOBILE_INPUT_DESCRIPTION"] = "Once the code has been successfully scanned or entered manually, your mobile phone will show the code you will have to enter below.";
$MESS["SEC_OTP_CONNECT_MOBILE_ENTER_CODE"] = "Enter code";
$MESS["SEC_OTP_CONNECT_MOBILE_INPUT_NEXT_DESCRIPTION"] = "The OTP algorithm requires two codes for authentication. Please generate the next code and enter it below.";
$MESS["SEC_OTP_CONNECT_MOBILE_ENTER_NEXT_CODE"] = "Enter next code";
$MESS["SEC_OTP_CONNECT_DONE"] = "Ready";
$MESS["SEC_OTP_CONNECT_DEVICE_TITLE"] = "Connect dongle";
$MESS["SEC_OTP_CONNECTED"] = "Connected";
$MESS["SEC_OTP_ENABLE"] = "Enable";
$MESS["SEC_OTP_DISABLE"] = "Disable";
$MESS["SEC_OTP_SYNC_NOW"] = "Synchronize";
$MESS["SEC_OTP_MOBILE_INPUT_METHODS_SEPARATOR"] = "or";
$MESS["SEC_OTP_MOBILE_SCAN_QR"] = "Scan QR code";
$MESS["SEC_OTP_MOBILE_MANUAL_INPUT"] = "Enter code manually";
$MESS["SEC_OTP_CONNECT_DEVICE"] = "Connect dongle";
$MESS["SEC_OTP_CONNECT_MOBILE"] = "Connect mobile device";
$MESS["SEC_OTP_CONNECT_NEW_DEVICE"] = "Connect new dongle";
$MESS["SEC_OTP_CONNECT_NEW_MOBILE"] = "Connect new mobile device";
$MESS["SEC_OTP_ERROR_TITLE"] = "Cannot save because an error occurred.";
$MESS["SEC_OTP_UNKNOWN_ERROR"] = "Unexpected error. Please try again later.";
$MESS["SEC_OTP_RECOVERY_CODES_BUTTON"] = "Backup codes";
$MESS["SEC_OTP_RECOVERY_CODES_TITLE"] = "Backup codes";
$MESS["SEC_OTP_RECOVERY_CODES_DESCRIPTION"] = "Copy the backup codes you may need if you lost your mobile device or cannot get a code via the app for any other reason.";
$MESS["SEC_OTP_RECOVERY_CODES_WARNING"] = "Keep them handy, say in your wallet or purse. Each of the codes can only be used once.";
$MESS["SEC_OTP_RECOVERY_CODES_PRINT"] = "Print";
$MESS["SEC_OTP_RECOVERY_CODES_SAVE_FILE"] = "Save to text file";
$MESS["SEC_OTP_RECOVERY_CODES_REGENERATE_DESCRIPTION"] = "Short on backup codes?<br/>
Create some new ones. <br/><br/>
Creating new backup codes invalidates <br/>the previously generated codes.";
$MESS["SEC_OTP_RECOVERY_CODES_REGENERATE"] = "Generate new codes";
$MESS["SEC_OTP_RECOVERY_CODES_NOTE"] = "A code can only be used once. Hint: strike used codes off the list.";
$MESS["SEC_OTP_WARNING_RECOVERY_CODES"] = "Two-step authentication is enabled but you didn't create backup codes. You may need them if you lost your mobile device or cannot get a code via the app for any other reason.";
$MESS["SEC_OTP_NO_DAYS"] = "forever";
$MESS["SEC_OTP_DEACTIVATE_UNTIL"] = "Disabled until #DATE#";
$MESS["SEC_OTP_MANDATORY_EXPIRED"] = "The time during which a user had to set up two-step authentication has now expired.";
$MESS["SEC_OTP_MANDATORY_ALMOST_EXPIRED"] = "The time during which a user has to set up two-step authentication will expire on #DATE#.";
$MESS["SEC_OTP_MANDATORY_DISABLED"] = "Mandatory two-step authentication disabled.";
$MESS["SEC_OTP_MANDATORY_ENABLE_DEFAULT"] = "Require the activation of two-step authentication";
$MESS["SEC_OTP_MANDATORY_ENABLE"] = "Require the activation of two-step authentication within";
$MESS["SEC_OTP_MANDATORY_DEFFER"] = "Extend";
?>