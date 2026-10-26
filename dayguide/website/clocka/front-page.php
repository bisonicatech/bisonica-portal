<?php
/**
 * Home page: the Clocka landing page.
 * Text that changes often (prices, store links, story) comes from Appearance › Customize › Clocka.
 */
get_header();

$clocka_month = clocka_mod( 'clocka_price_month' );
$clocka_year  = clocka_mod( 'clocka_price_year' );
$clocka_trial = clocka_mod( 'clocka_trial' );
?>

<section class="hero">
	<div class="wrap">
		<div>
			<span class="eyebrow"><?php esc_html_e( 'For families living with dementia', 'clocka' ); ?></span>
			<h1><?php esc_html_e( 'A gentle day clock for someone you love', 'clocka' ); ?></h1>
			<p class="lead"><?php esc_html_e( 'Clocka shows the time, whether it\'s morning or night, and one simple thing to do now. And it lets the family help from their own phones.', 'clocka' ); ?></p>
			<?php clocka_store_buttons(); ?>
			<p class="price-note">
				<?php
				/* translators: 1: monthly price, 2: free trial length */
				printf( esc_html__( 'Free to download. Premium from %1$s a month, with a %2$s free trial.', 'clocka' ), esc_html( $clocka_month ), esc_html( $clocka_trial ) );
				?>
			</p>
		</div>
		<div class="hero-art">
			<img class="phone" src="<?php echo clocka_asset( 'img/app-morning.png' ); ?>" alt="<?php esc_attr_e( 'Clocka on a phone: MORNING, 7:20 am, Good morning, Dad! Time to get up and get dressed, with a Call Sarah button.', 'clocka' ); ?>" width="417" height="870">
			<img class="mascot" src="<?php echo clocka_asset( 'img/mascot.svg' ); ?>" alt="" width="240" height="240">
		</div>
	</div>
</section>

<section class="section">
	<div class="wrap">
		<div class="story">
			<img src="<?php echo clocka_asset( 'img/mascot.svg' ); ?>" alt="" width="160" height="160">
			<blockquote>
				<?php echo esc_html( clocka_mod( 'clocka_story' ) ); ?>
				<cite><?php echo esc_html( clocka_mod( 'clocka_story_name' ) ); ?></cite>
			</blockquote>
		</div>
	</div>
</section>

<section class="section section--sky" id="how">
	<div class="wrap center">
		<h2><?php esc_html_e( 'Simple for them. Reassuring for you.', 'clocka' ); ?></h2>
		<p class="lead"><?php esc_html_e( 'Clocka runs on two phones: theirs shows the clock, yours lets you help from anywhere.', 'clocka' ); ?></p>
		<div class="steps" style="text-align:left">
			<div class="step">
				<h3><?php esc_html_e( 'Set up their phone', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'Install Clocka on the phone they use, type their first name, and leave it on the clock. Big, clear and calm.', 'clocka' ); ?></p>
			</div>
			<div class="step">
				<h3><?php esc_html_e( 'Link your phone', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'Install Clocka on yours, choose "family member", and type the 8-digit code into their phone. That\'s it.', 'clocka' ); ?></p>
			</div>
			<div class="step">
				<h3><?php esc_html_e( 'Plan their day', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'Set times like "Time for lunch" or "Time to get ready for bed". They see the right message at the right time.', 'clocka' ); ?></p>
			</div>
		</div>
	</div>
</section>

<section class="section">
	<div class="wrap center">
		<h2><?php esc_html_e( 'Day or night, they know where they are', 'clocka' ); ?></h2>
		<p class="lead"><?php esc_html_e( 'Colours change through the day. At night the screen goes dark and quiet, so a glance at 3am says "it\'s still night, go back to bed" without waking anyone.', 'clocka' ); ?></p>
		<div class="screens">
			<div class="screen-card">
				<img src="<?php echo clocka_asset( 'img/app-morning.png' ); ?>" alt="<?php esc_attr_e( 'Morning screen: Good morning, Dad! Time to get up and get dressed.', 'clocka' ); ?>" loading="lazy" width="417" height="870">
				<h3><?php esc_html_e( 'Clear in the morning', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'The time, the day and one simple instruction, with a big button to call you.', 'clocka' ); ?></p>
			</div>
			<div class="screen-card">
				<img src="<?php echo clocka_asset( 'img/app-night.png' ); ?>" alt="<?php esc_attr_e( 'Night screen at 3:05 am: It\'s still night-time. Everyone is asleep. Go back to bed.', 'clocka' ); ?>" loading="lazy" width="417" height="870">
				<h3><?php esc_html_e( 'Calm at night', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'Dark, dim and completely silent. No alarms, no sounds, just reassurance.', 'clocka' ); ?></p>
			</div>
			<div class="screen-card">
				<img src="<?php echo clocka_asset( 'img/app-family.png' ); ?>" alt="<?php esc_attr_e( 'Family screen: Out mode is on, next check-in time, and a button to send a message to Dad\'s screen.', 'clocka' ); ?>" loading="lazy" width="417" height="870">
				<h3><?php esc_html_e( 'Peace of mind for you', 'clocka' ); ?></h3>
				<p><?php esc_html_e( 'See what their screen says, change their day, and know they\'re okay while you\'re out.', 'clocka' ); ?></p>
			</div>
		</div>
	</div>
</section>

<section class="section section--cream" id="features">
	<div class="wrap">
		<div class="center">
			<h2><?php esc_html_e( 'Everything in one gentle app', 'clocka' ); ?></h2>
		</div>
		<div class="features">
			<div class="feature-col">
				<h3>🕰️ <?php esc_html_e( 'For the person you care for', 'clocka' ); ?></h3>
				<ul class="feature-list">
					<li><span class="ico">☀️</span><div><strong><?php esc_html_e( 'Morning, afternoon, evening, night', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'Large time, day and date, with colours that follow the day.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">💬</span><div><strong><?php esc_html_e( 'One thing to do now', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( '"Time for breakfast", "Time for a cup of tea", "Time for bed", in your own words.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">🌙</span><div><strong><?php esc_html_e( 'Silent at night', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'Gentle reminder sounds by day, never at night.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">📞</span><div><strong><?php esc_html_e( 'Call you with one tap', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'A big button with your name on it.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">👍</span><div><strong><?php esc_html_e( '"I\'m okay"', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'When you\'re out, one tap lets you know all is well.', 'clocka' ); ?></span></div></li>
				</ul>
			</div>
			<div class="feature-col">
				<h3>👪 <?php esc_html_e( 'For the family', 'clocka' ); ?></h3>
				<ul class="feature-list">
					<li><span class="ico">📅</span><div><strong><?php esc_html_e( 'Plan their day from your phone', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'Change times and messages, and see what their screen says right now.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">🏡</span><div><strong><?php esc_html_e( 'Out mode', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'Going to the shops? Their screen says where you\'ve gone, when you\'ll be back and what to do meanwhile.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">✅</span><div><strong><?php esc_html_e( 'Check-ins and alerts', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'Clocka asks "Are you okay?" while you\'re out, and tells you if there\'s no answer.', 'clocka' ); ?></span></div></li>
					<li><span class="ico">✉️</span><div><strong><?php esc_html_e( 'Messages to their screen', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( '"Sara is coming at 2pm" or "Taxi to the doctor at 10:30".', 'clocka' ); ?></span></div></li>
					<li><span class="ico">🎥</span><div><strong><?php esc_html_e( 'Video call button', 'clocka' ); ?></strong><span class="txt"><?php esc_html_e( 'One tap to see a familiar face.', 'clocka' ); ?></span></div></li>
				</ul>
			</div>
		</div>
	</div>
</section>

<section class="section section--navy" id="pricing">
	<div class="wrap center">
		<h2><?php esc_html_e( 'Start free. Upgrade when you need more.', 'clocka' ); ?></h2>
		<div class="plans" style="text-align:left">
			<div class="plan">
				<h3><?php esc_html_e( 'Free', 'clocka' ); ?></h3>
				<div class="price">£0</div>
				<p class="alt"><?php esc_html_e( 'Free forever', 'clocka' ); ?></p>
				<ul>
					<li><?php esc_html_e( 'The day clock with up to 8 daily times', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Their phone plus one family member', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Out mode, check-ins and alerts', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'One call button', 'clocka' ); ?></li>
				</ul>
			</div>
			<div class="plan plan--premium">
				<span class="badge">
					<?php
					/* translators: %s: free trial length, e.g. "1 month" */
					printf( esc_html__( '%s free trial', 'clocka' ), esc_html( $clocka_trial ) );
					?>
				</span>
				<h3><?php esc_html_e( 'Premium', 'clocka' ); ?></h3>
				<div class="price"><?php echo esc_html( $clocka_month ); ?> <small><?php esc_html_e( 'a month', 'clocka' ); ?></small></div>
				<p class="alt">
					<?php
					/* translators: %s: yearly price */
					printf( esc_html__( 'or %s a year. Covers the whole family.', 'clocka' ), esc_html( $clocka_year ) );
					?>
				</p>
				<ul>
					<li><?php esc_html_e( 'Everything in Free, plus:', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Unlimited daily times, different on each day of the week', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Unlimited family members', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Your own Out messages, and messages to their screen any time', 'clocka' ); ?></li>
					<li><?php esc_html_e( 'Extra call buttons and a video call button', 'clocka' ); ?></li>
				</ul>
			</div>
		</div>
		<p class="plans-note"><?php esc_html_e( 'Subscriptions are bought inside the app and billed through the App Store or Google Play. Cancel any time in your phone\'s settings.', 'clocka' ); ?></p>
	</div>
</section>

<section class="section" id="faq">
	<div class="wrap">
		<div class="center">
			<h2><?php esc_html_e( 'Questions families ask', 'clocka' ); ?></h2>
		</div>
		<div class="faq">
			<details>
				<summary><?php esc_html_e( 'Who is Clocka for?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'People who sometimes lose track of the time or what to do next, often because of dementia or memory loss, and the family members who support them.', 'clocka' ); ?></p>
			</details>
			<details>
				<summary><?php esc_html_e( 'Do we need two phones?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'Clocka works on its own on one phone as a day clock. To plan their day from your phone, use Out mode and get check-in alerts, you need Clocka on your phone too.', 'clocka' ); ?></p>
			</details>
			<details>
				<summary><?php esc_html_e( 'Will it make noise at night?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'No. Night-time messages never make a sound. If they wake and look at the screen, it calmly tells them it\'s still night.', 'clocka' ); ?></p>
			</details>
			<details>
				<summary><?php esc_html_e( 'Can they change the settings by accident?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'Settings are hidden behind a long press and a 4-digit PIN, so the clock stays as you set it.', 'clocka' ); ?></p>
			</details>
			<details>
				<summary><?php esc_html_e( 'Which phones does it work on?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'iPhone and Android. If a store button above says "Coming soon", that version is on its way.', 'clocka' ); ?></p>
			</details>
			<details>
				<summary><?php esc_html_e( 'How much does it cost, and how do I cancel?', 'clocka' ); ?></summary>
				<p>
					<?php
					/* translators: 1: monthly price, 2: yearly price, 3: trial length */
					printf( esc_html__( 'Clocka is free. Premium is %1$s a month or %2$s a year after a %3$s free trial, and covers every phone in the family. Cancel any time in your phone\'s subscription settings.', 'clocka' ), esc_html( $clocka_month ), esc_html( $clocka_year ), esc_html( $clocka_trial ) );
					?>
				</p>
			</details>
			<details>
				<summary><?php esc_html_e( 'What happens to our information?', 'clocka' ); ?></summary>
				<p>
					<?php esc_html_e( 'Clocka keeps only what it needs, such as first names and the daily schedule. No adverts, no tracking and no selling of data. You can delete everything from inside the app.', 'clocka' ); ?>
					<?php if ( clocka_mod( 'clocka_privacy_url' ) ) : ?>
						<a href="<?php echo esc_url( clocka_mod( 'clocka_privacy_url' ) ); ?>"><?php esc_html_e( 'Read the privacy policy.', 'clocka' ); ?></a>
					<?php endif; ?>
				</p>
			</details>
			<details>
				<summary><?php esc_html_e( 'Is Clocka a medical device?', 'clocka' ); ?></summary>
				<p><?php esc_html_e( 'No. Clocka is a daily routine and reminder app. It doesn\'t diagnose, treat or monitor any condition, and it isn\'t a replacement for care or an emergency alarm.', 'clocka' ); ?></p>
			</details>
		</div>
	</div>
</section>

<section class="section section--cream cta" id="get">
	<div class="wrap">
		<img src="<?php echo clocka_asset( 'img/mascot.svg' ); ?>" alt="" width="150" height="150">
		<h2><?php esc_html_e( 'Give them a calmer day', 'clocka' ); ?></h2>
		<p class="lead"><?php esc_html_e( 'Download Clocka free, set it up in a few minutes, and try Premium free for a month.', 'clocka' ); ?></p>
		<?php clocka_store_buttons(); ?>
		<?php if ( clocka_mod( 'clocka_email' ) ) : ?>
			<p class="price-note">
				<?php esc_html_e( 'Questions? Email', 'clocka' ); ?>
				<a href="mailto:<?php echo esc_attr( antispambot( clocka_mod( 'clocka_email' ) ) ); ?>"><?php echo esc_html( antispambot( clocka_mod( 'clocka_email' ) ) ); ?></a>
			</p>
		<?php endif; ?>
	</div>
</section>

<?php
get_footer();
