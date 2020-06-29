################################################################################
#
# Build system stages
#
################################################################################

# Phony targets for build stages
.PHONY: checkout
.PHONY: build
.PHONY: install
.PHONY: all
.PHONE: clean
.PHONY: distclean

# Set the stage used when make is called with no arguments
all: install
