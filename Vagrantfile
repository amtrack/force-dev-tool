# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.define "win10" do |win10|
    win10.vm.box = "modernIE/w10-edge"
    win10.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
    end
    win10.vm.provision "shell", inline: "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))"
    win10.vm.provision "shell", inline: "choco install git nodejs -y"
    win10.vm.provision "shell", inline: "git config --global core.autocrlf false; cd C:/vagrant; npm install"
  end
end
