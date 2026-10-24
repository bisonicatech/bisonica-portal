<?php
/**
 * Clocka theme setup.
 *
 * Everything that changes often (store links, prices, story, contact email)
 * is under Appearance › Customize › Clocka.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function clocka_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );
	register_nav_menus(
		array(
			'footer' => __( 'Footer links', 'clocka' ),
		)
	);
}
add_action( 'after_setup_theme', 'clocka_setup' );

function clocka_assets() {
	$ver = wp_get_theme()->get( 'Version' );
	wp_enqueue_style( 'clocka', get_stylesheet_uri(), array(), $ver );
}
add_action( 'wp_enqueue_scripts', 'clocka_assets' );

/** URL of a file in the theme's assets folder. */
function clocka_asset( $path ) {
	return esc_url( get_template_directory_uri() . '/assets/' . ltrim( $path, '/' ) );
}

/** Use the Clocka icon as the browser tab icon when no Site Icon has been set. */
function clocka_favicon() {
	if ( ! has_site_icon() ) {
		echo '<link rel="icon" href="' . clocka_asset( 'img/site-icon.png' ) . '" sizes="512x512">' . "\n";
		echo '<link rel="apple-touch-icon" href="' . clocka_asset( 'img/site-icon.png' ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'clocka_favicon' );

/** A short description for search engines on the home page. */
function clocka_meta_description() {
	if ( is_front_page() ) {
		echo '<meta name="description" content="' . esc_attr__( 'Clocka is a gentle day clock for people living with dementia. It shows the time, the part of the day and one simple thing to do now, and lets the family help from their own phones.', 'clocka' ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'clocka_meta_description', 1 );

/** Default settings. */
function clocka_defaults() {
	return array(
		'clocka_appstore_url' => '',
		'clocka_testflight_url' => '',
		'clocka_play_url'     => '',
		'clocka_price_month'  => '£2.99',
		'clocka_price_year'   => '£24.99',
		'clocka_trial'        => '1 month',
		'clocka_email'        => 'info@clocka.co.uk',
		'clocka_privacy_url'  => 'https://clocka.co.uk/clocka_privacy_privacy.html',
		'clocka_story'        => "Clocka started at 3 o'clock in the morning. My dad lives with dementia, and he would wake in the middle of the night, get dressed and start his day, while his wife was up with him, worn out. We wanted something simple that answered the question he kept asking: what should I be doing now?",
		'clocka_story_name'   => 'Jason Nicholls, founder of Clocka',
	);
}

/** A Customizer setting, falling back to the default. */
function clocka_mod( $key ) {
	$defaults = clocka_defaults();
	return get_theme_mod( $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

function clocka_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'clocka',
		array(
			'title'       => __( 'Clocka', 'clocka' ),
			'description' => __( 'Store links, prices and the founder\'s story. App Store link: in App Store Connect open your app > App Information and copy the Apple ID (a long number). Your link is https://apps.apple.com/gb/app/clocka/id followed by that number; it starts working when Apple publishes the app. Until then you can paste a TestFlight public link to let people try the beta. Leave a link empty to show "Coming soon".', 'clocka' ),
			'priority'    => 30,
		)
	);
	$fields = array(
		'clocka_appstore_url' => array( __( 'App Store link (iPhone)', 'clocka' ), 'url' ),
		'clocka_testflight_url' => array( __( 'TestFlight beta link (used until the App Store link is added)', 'clocka' ), 'url' ),
		'clocka_play_url'     => array( __( 'Google Play link (Android)', 'clocka' ), 'url' ),
		'clocka_price_month'  => array( __( 'Premium price per month', 'clocka' ), 'text' ),
		'clocka_price_year'   => array( __( 'Premium price per year', 'clocka' ), 'text' ),
		'clocka_trial'        => array( __( 'Free trial length (e.g. 1 month)', 'clocka' ), 'text' ),
		'clocka_email'        => array( __( 'Contact email', 'clocka' ), 'email' ),
		'clocka_privacy_url'  => array( __( 'Privacy policy link', 'clocka' ), 'url' ),
		'clocka_story'        => array( __( 'Founder\'s story', 'clocka' ), 'textarea' ),
		'clocka_story_name'   => array( __( 'Story signed by', 'clocka' ), 'text' ),
	);
	$defaults = clocka_defaults();
	foreach ( $fields as $id => $field ) {
		$sanitize = 'url' === $field[1] ? 'esc_url_raw' : ( 'email' === $field[1] ? 'sanitize_email' : ( 'textarea' === $field[1] ? 'sanitize_textarea_field' : 'sanitize_text_field' ) );
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $defaults[ $id ],
				'sanitize_callback' => $sanitize,
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'   => $field[0],
				'section' => 'clocka',
				'type'    => $field[1],
			)
		);
	}
}
add_action( 'customize_register', 'clocka_customize_register' );

/** The App Store and Google Play buttons. A missing link shows "Coming soon". */
function clocka_store_buttons( $style = '' ) {
	$ios       = clocka_mod( 'clocka_appstore_url' );
	$ios_label = __( 'Download for', 'clocka' );
	if ( ! $ios && clocka_mod( 'clocka_testflight_url' ) ) {
		// Before the App Store launch: send iPhone users to the TestFlight beta.
		$ios       = clocka_mod( 'clocka_testflight_url' );
		$ios_label = __( 'Try the beta on', 'clocka' );
	}
	$stores = array(
		array( $ios, $ios_label, __( 'iPhone', 'clocka' ) ),
		array( clocka_mod( 'clocka_play_url' ), __( 'Get it for', 'clocka' ), __( 'Android', 'clocka' ) ),
	);
	echo '<div class="store-buttons">';
	foreach ( $stores as $store ) {
		list( $url, $small, $big ) = $store;
		if ( $url ) {
			printf(
				'<a class="btn store-btn %1$s" href="%2$s" rel="noopener"><small>%3$s</small><strong>%4$s</strong></a>',
				esc_attr( $style ),
				esc_url( $url ),
				esc_html( $small ),
				esc_html( $big )
			);
		} else {
			printf(
				'<span class="btn store-btn btn--disabled" aria-disabled="true"><small>%1$s</small><strong>%2$s</strong></span>',
				esc_html__( 'Coming soon for', 'clocka' ),
				esc_html( $big )
			);
		}
	}
	echo '</div>';
}

/** UK organisations shown on the Support page (numbers and websites only; opening hours change). */
function clocka_helplines() {
	return array(
		array( "Alzheimer's Society", __( 'Dementia Support Line: information, advice and emotional support for anyone affected by dementia.', 'clocka' ), '0333 150 3456', 'https://www.alzheimers.org.uk' ),
		array( 'Dementia UK', __( 'Admiral Nurse Dementia Helpline: free advice from specialist dementia nurses.', 'clocka' ), '0800 888 6678', 'https://www.dementiauk.org' ),
		array( 'Carers UK', __( 'Advice and support for the person doing the caring.', 'clocka' ), '0808 808 7777', 'https://www.carersuk.org' ),
		array( 'Age UK', __( 'Advice Line for older people and their families: care, money and practical help.', 'clocka' ), '0800 678 1602', 'https://www.ageuk.org.uk' ),
		array( 'NHS', __( 'Living with dementia, getting a diagnosis, and care and support.', 'clocka' ), '', 'https://www.nhs.uk/conditions/dementia/' ),
	);
}

/** Address of the Support page. */
function clocka_support_url() {
	$page = get_page_by_path( 'support' );
	return $page ? get_permalink( $page ) : home_url( '/support/' );
}

/** Create the Support page when the theme is activated, if there isn't one already. */
function clocka_create_support_page() {
	if ( get_page_by_path( 'support' ) ) {
		return;
	}
	wp_insert_post(
		array(
			'post_title'   => __( 'Help and support', 'clocka' ),
			'post_name'    => 'support',
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_content' => '',
		)
	);
}
add_action( 'after_switch_theme', 'clocka_create_support_page' );
