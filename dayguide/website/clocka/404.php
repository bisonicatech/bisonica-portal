<?php
/**
 * Page not found.
 */
get_header();
?>
<div class="page-content" style="text-align:center">
	<img src="<?php echo clocka_asset( 'img/mascot.svg' ); ?>" alt="" width="150" height="150" style="margin:0 auto 10px">
	<h1><?php esc_html_e( 'This page isn\'t here', 'clocka' ); ?></h1>
	<p><a class="btn" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Go to the home page', 'clocka' ); ?></a></p>
</div>
<?php
get_footer();
