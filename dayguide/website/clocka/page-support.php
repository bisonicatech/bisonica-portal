<?php
/**
 * Help and support page. WordPress uses this automatically for the page whose
 * address is /support/ (created when the theme is activated). Anything typed
 * into that page in the editor appears under the contact box.
 */
get_header();
$clocka_email = clocka_mod( 'clocka_email' );
?>
<div class="page-content support">
	<h1><?php esc_html_e( 'Help and support', 'clocka' ); ?></h1>
	<p class="lead"><?php esc_html_e( 'Help with Clocka, and where to find support for dementia and caring.', 'clocka' ); ?></p>

	<div class="support-box">
		<h2><?php esc_html_e( 'Contact Clocka', 'clocka' ); ?></h2>
		<p><?php esc_html_e( 'Questions, problems or ideas? We\'re a small team and read every message. We aim to reply within two working days.', 'clocka' ); ?></p>
		<?php if ( $clocka_email ) : ?>
			<p><a class="btn" href="mailto:<?php echo esc_attr( antispambot( $clocka_email ) ); ?>?subject=<?php echo rawurlencode( 'Clocka help' ); ?>"><?php echo esc_html( antispambot( $clocka_email ) ); ?></a></p>
		<?php endif; ?>
		<p class="small"><?php esc_html_e( 'In the app: open the family screen (or hold the clock time for 3 seconds on the other phone) and choose Help and support.', 'clocka' ); ?></p>
	</div>

	<?php
	while ( have_posts() ) :
		the_post();
		the_content();
	endwhile;
	?>

	<h2><?php esc_html_e( 'Quick answers', 'clocka' ); ?></h2>
	<div class="faq" style="margin-top:12px">
		<details>
			<summary><?php esc_html_e( 'How do I link the two phones?', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'On the family member\'s phone, tap "Show a link code". On the other phone, hold the clock time for 3 seconds, enter the settings PIN, type the 6-digit code and tap Save. Codes last 15 minutes; you can always get a new one.', 'clocka' ); ?></p>
		</details>
		<details>
			<summary><?php esc_html_e( 'How does Out mode work?', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'Before you go out, choose when you\'ll be back and how often Clocka should check in. Their screen shows where you\'ve gone and what to do meanwhile, and asks "Are you okay?" at the times you chose. If there\'s no answer within 15 minutes, you get an alert.', 'clocka' ); ?></p>
		</details>
		<details>
			<summary><?php esc_html_e( 'I\'ve forgotten the settings PIN', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'Delete Clocka from that phone, install it again and link it to the family phone. The shared schedule comes back automatically.', 'clocka' ); ?></p>
		</details>
		<details>
			<summary><?php esc_html_e( 'Reminders aren\'t making a sound', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'Check the phone isn\'t on silent or Do Not Disturb, and that notifications for Clocka are allowed in the phone\'s Settings. Night-time messages are always silent on purpose.', 'clocka' ); ?></p>
		</details>
		<details>
			<summary><?php esc_html_e( 'How do I cancel Premium?', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'iPhone: Settings › your name › Subscriptions › Clocka. Android: Google Play › your profile › Payments & subscriptions. Premium stays on until the end of the period you\'ve paid for.', 'clocka' ); ?></p>
		</details>
		<details>
			<summary><?php esc_html_e( 'How do I delete our information?', 'clocka' ); ?></summary>
			<p><?php esc_html_e( 'On the phone of the family member who set Clocka up, open Privacy and your data and choose Delete all data. Or email us and we\'ll do it for you.', 'clocka' ); ?></p>
		</details>
	</div>

	<h2><?php esc_html_e( 'Dementia help and advice', 'clocka' ); ?></h2>
	<p><?php esc_html_e( 'Free and independent UK organisations. Clocka isn\'t connected to them; we list them because they help families like ours.', 'clocka' ); ?></p>
	<div class="helplines">
		<?php foreach ( clocka_helplines() as $org ) : ?>
			<div class="helpline">
				<h3><?php echo esc_html( $org[0] ); ?></h3>
				<p><?php echo esc_html( $org[1] ); ?></p>
				<p class="helpline-links">
					<?php if ( $org[2] ) : ?>
						<a class="btn btn--small" href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $org[2] ) ); ?>">📞 <?php echo esc_html( $org[2] ); ?></a>
					<?php endif; ?>
					<a class="btn btn--small btn--ghost" href="<?php echo esc_url( $org[3] ); ?>" rel="noopener"><?php esc_html_e( 'Website', 'clocka' ); ?></a>
				</p>
			</div>
		<?php endforeach; ?>
	</div>

	<div class="support-box support-box--urgent">
		<h2><?php esc_html_e( 'Urgent help', 'clocka' ); ?></h2>
		<p><?php esc_html_e( 'In an emergency, call 999. For urgent medical advice, call NHS 111. Clocka is a reminder app, not an emergency alarm or a medical device.', 'clocka' ); ?></p>
	</div>
</div>
<?php
get_footer();
