# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.define "win10" do |win10|
    win10.vm.box = "win10-msedge"
    win10.vm.network "forwarded_port", guest: 3389, host: 3389, id: "rdp", auto_correct: true

    win10.vm.communicator = "winrm"
    win10.winrm.username = "IEUser"
    win10.winrm.password = "Passw0rd!"

    win10.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
    end
    win10.vm.provision "shell", inline: "choco install nodejs -y"
    win10.vm.provision "shell", inline: "git config --global core.autocrlf false; cd C:/vagrant; npm install"
  end
end
