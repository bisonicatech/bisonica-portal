<?php
/**
 * Site header.
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'clocka' ); ?></a>
<header class="site-header">
	<div class="wrap">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<img src="<?php echo clocka_asset( 'img/icon.png' ); ?>" alt="" width="42" height="42">
			<span>Clocka</span>
		</a>
		<nav class="nav" aria-label="<?php esc_attr_e( 'Main', 'clocka' ); ?>">
			<?php $home = is_front_page() ? '' : esc_url( home_url( '/' ) ); ?>
			<a href="<?php echo $home; ?>#how"><?php esc_html_e( 'How it works', 'clocka' ); ?></a>
			<a href="<?php echo $home; ?>#features"><?php esc_html_e( 'Features', 'clocka' ); ?></a>
			<a href="<?php echo $home; ?>#pricing"><?php esc_html_e( 'Pricing', 'clocka' ); ?></a>
			<a href="<?php echo $home; ?>#faq"><?php esc_html_e( 'Questions', 'clocka' ); ?></a>
			<a class="btn btn--small" href="<?php echo $home; ?>#get"><?php esc_html_e( 'Get Clocka', 'clocka' ); ?></a>
		</nav>
	</div>
</header>
<main id="main">
