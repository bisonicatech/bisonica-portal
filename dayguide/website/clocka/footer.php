<?php
/**
 * Site footer.
 */
$clocka_email   = clocka_mod( 'clocka_email' );
$clocka_privacy = clocka_mod( 'clocka_privacy_url' );
?>
</main>
<footer class="site-footer">
	<div class="wrap">
		<div>
			<strong style="color:#fff">Clocka</strong> &middot; &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?>
			<p class="small">
				<?php esc_html_e( 'Clocka is a daily routine and reminder app. It is not a medical device and does not diagnose, treat or monitor any condition. In an emergency, call 999.', 'clocka' ); ?>
			</p>
		</div>
		<nav aria-label="<?php esc_attr_e( 'Footer', 'clocka' ); ?>">
			<a href="<?php echo esc_url( clocka_support_url() ); ?>"><?php esc_html_e( 'Help and support', 'clocka' ); ?></a>
			<?php if ( $clocka_privacy ) : ?>
				<a href="<?php echo esc_url( $clocka_privacy ); ?>"><?php esc_html_e( 'Privacy policy', 'clocka' ); ?></a>
			<?php endif; ?>
			<?php if ( $clocka_email ) : ?>
				<a href="mailto:<?php echo esc_attr( antispambot( $clocka_email ) ); ?>"><?php echo esc_html( antispambot( $clocka_email ) ); ?></a>
			<?php endif; ?>
			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'items_wrap'     => '<ul class="footer-menu">%3$s</ul>',
					'fallback_cb'    => false,
					'depth'          => 1,
				)
			);
			?>
		</nav>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
